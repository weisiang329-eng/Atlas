/**
 * /v1/analysts — the research department and its console.
 *
 * Governance is ported from the Hookka ERP agent console, which had already
 * solved the part that matters: an agent that can act unattended needs a
 * visible history, a pause switch, and an explicit autonomy level. Without
 * those the owner cannot answer "what did it do, and can I stop it".
 *
 *   agent_run     every execution, with status, tokens, output and error
 *   agent_control per-analyst pause + phase (1 propose / 2 auto-tune / 3 auto),
 *                 plus the 'ALL' row that pauses the whole department
 */
import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import type { Env } from "../index.ts";
import { createDb } from "../db/repo.ts";
import { agentControl, agentRun } from "../db/schema.ts";
import {
  ANALYSTS,
  ANALYST_IDS,
  systemPromptFor,
  type AnalystId,
} from "../agent/analysts.ts";
import { isAgentConfigured, runAgent } from "../agent/runtime.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const analysts = new Hono<AppEnv>();

const isAnalyst = (v: string): v is AnalystId =>
  (ANALYST_IDS as string[]).includes(v);

/**
 * Wrap ONE analyst execution: insert a `running` row, run `fn`, then finalise
 * as ok/error. The wrapped result (or throw) passes straight through —
 * logging must never change behaviour, only record it.
 */
async function recordRun<T>(
  db: ReturnType<typeof createDb>,
  agent: string,
  request: string,
  fn: (report: {
    addTokens: (i: number, o: number) => void;
    setSummary: (s: string) => void;
    setOutput: (s: string) => void;
  }) => Promise<T>,
): Promise<T> {
  const id = crypto.randomUUID();
  let tokensIn = 0;
  let tokensOut = 0;
  let summary = "";
  let output = "";

  await db.insert(agentRun).values({ id, agent, request, status: "running" });

  try {
    const result = await fn({
      addTokens: (i, o) => {
        tokensIn += Math.max(0, Math.floor(Number(i) || 0));
        tokensOut += Math.max(0, Math.floor(Number(o) || 0));
      },
      setSummary: (s) => {
        summary = s;
      },
      setOutput: (s) => {
        output = s;
      },
    });
    await db
      .update(agentRun)
      .set({
        status: "ok",
        finishedAt: new Date(),
        summary,
        output,
        tokensIn,
        tokensOut,
      })
      .where(eq(agentRun.id, id));
    return result;
  } catch (err) {
    await db
      .update(agentRun)
      .set({
        status: "error",
        finishedAt: new Date(),
        summary,
        tokensIn,
        tokensOut,
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(agentRun.id, id));
    throw err;
  }
}

/* ── Console ──────────────────────────────────────────────────────────── */

/** The department: every analyst's mandate, control state and last runs. */
analysts.get("/", async (c) => {
  const db = c.get("db");
  const [controls, runs] = await Promise.all([
    db.select().from(agentControl),
    db.select().from(agentRun).orderBy(desc(agentRun.startedAt)).limit(50),
  ]);
  const byAgent = new Map(controls.map((x) => [x.agent, x]));

  return c.json({
    configured: isAgentConfigured(c.env),
    killSwitch: byAgent.get("ALL")?.paused ?? false,
    analysts: ANALYST_IDS.map((id) => {
      const a = ANALYSTS[id];
      const ctl = byAgent.get(id);
      const recent = runs.filter((r) => r.agent === id).slice(0, 5);
      return {
        id: a.id,
        name: a.name,
        nameZh: a.nameZh,
        mission: a.mission,
        missionZh: a.missionZh,
        responsibilities: a.responsibilities,
        sources: a.sources,
        boundaries: a.boundaries,
        deliverables: a.deliverables,
        paused: ctl?.paused ?? false,
        phase: ctl?.phase ?? 1,
        lastRun: recent[0] ?? null,
        recentRuns: recent,
      };
    }),
  });
});

/** Full run history, optionally filtered to one analyst. */
analysts.get("/runs", async (c) => {
  const db = c.get("db");
  const agent = c.req.query("agent");
  const rows = agent
    ? await db
        .select()
        .from(agentRun)
        .where(eq(agentRun.agent, agent))
        .orderBy(desc(agentRun.startedAt))
        .limit(100)
    : await db
        .select()
        .from(agentRun)
        .orderBy(desc(agentRun.startedAt))
        .limit(100);
  return c.json({ runs: rows });
});

/** Pause / resume, or move an analyst's autonomy phase. */
analysts.post("/:id/control", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  if (id !== "ALL" && !isAnalyst(id)) {
    return c.json({ error: "Unknown analyst." }, 404);
  }

  let body: { paused?: unknown; phase?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Expected a JSON body." }, 400);
  }

  const patch: { paused?: boolean; phase?: number; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (typeof body.paused === "boolean") patch.paused = body.paused;
  if (body.phase !== undefined) {
    const phase = Number(body.phase);
    if (![1, 2, 3].includes(phase)) {
      return c.json(
        { error: "phase must be 1 (propose), 2 (auto-tune) or 3 (full-auto)." },
        400,
      );
    }
    patch.phase = phase;
  }

  await db
    .insert(agentControl)
    .values({
      agent: id,
      paused: patch.paused ?? false,
      phase: patch.phase ?? 1,
    })
    .onConflictDoUpdate({ target: agentControl.agent, set: patch });

  const [row] = await db
    .select()
    .from(agentControl)
    .where(eq(agentControl.agent, id));
  return c.json({ control: row });
});

/* ── Run an analyst ───────────────────────────────────────────────────── */

analysts.post("/:id/run", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  if (!isAnalyst(id)) return c.json({ error: "Unknown analyst." }, 404);

  if (!isAgentConfigured(c.env)) {
    return c.json(
      { error: "The research department is not configured (ANTHROPIC_API_KEY)." },
      503,
    );
  }

  // The kill switch and the per-analyst pause are checked before any token is
  // spent — a paused agent must cost nothing, not merely produce nothing.
  const controls = await db
    .select()
    .from(agentControl)
    .where(and(eq(agentControl.agent, "ALL")));
  if (controls[0]?.paused) {
    return c.json({ error: "All agents are paused (global kill switch)." }, 423);
  }
  const [own] = await db
    .select()
    .from(agentControl)
    .where(eq(agentControl.agent, id));
  if (own?.paused) {
    return c.json({ error: `${ANALYSTS[id].name} is paused.` }, 423);
  }

  let body: { question?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Expected a JSON body with a 'question'." }, 400);
  }
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return c.json({ error: "Ask a question." }, 400);
  if (question.length > 2000) {
    return c.json({ error: "Question is too long." }, 400);
  }

  try {
    const result = await recordRun(db, id, question, async (report) => {
      const out = await runAgent(
        db,
        {
          apiKey: c.env.ANTHROPIC_API_KEY!,
          model: c.env.AGENT_MODEL,
          system: systemPromptFor(id),
        },
        question,
      );
      report.setOutput(out.answer);
      report.setSummary(
        `${ANALYSTS[id].name} · ${out.steps ?? 0} step(s) · ${out.answer.length} chars`,
      );
      return out;
    });
    return c.json({ analyst: id, ...result });
  } catch (err) {
    console.error("Analyst error:", err);
    return c.json(
      { error: "The analyst could not complete the request." },
      502,
    );
  }
});
