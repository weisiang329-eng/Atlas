/**
 * /v1/agent — the Atlas research analyst (P020).
 *
 * POST /ask { question } → { answer, trace, steps }.
 * GET  /status → whether the agent is configured (key present) for the UI.
 *
 * The API key is a Worker secret (ANTHROPIC_API_KEY); it is read here and
 * passed to the runtime, never returned to the client.
 */
import { Hono } from "hono";
import type { Env } from "../index";
import { createDb } from "../db/repo";
import { isAgentConfigured, runAgent } from "../agent/runtime";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const agent = new Hono<AppEnv>();

agent.get("/status", (c) =>
  c.json({ configured: isAgentConfigured(c.env), model: c.env.AGENT_MODEL ?? "claude-sonnet-5" }),
);

agent.post("/ask", async (c) => {
  if (!isAgentConfigured(c.env)) {
    return c.json(
      { error: "The agent is not configured. Set the ANTHROPIC_API_KEY secret." },
      503,
    );
  }
  let body: { question?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Expected a JSON body with a 'question' field." }, 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return c.json({ error: "Ask a question." }, 400);
  if (question.length > 2000) return c.json({ error: "Question is too long." }, 400);

  try {
    const result = await runAgent(c.get("db"), {
      apiKey: c.env.ANTHROPIC_API_KEY!,
      model: c.env.AGENT_MODEL,
    }, question);
    return c.json(result);
  } catch (err) {
    console.error("Agent error:", err);
    return c.json(
      { error: "The agent could not complete the request. Please try again." },
      502,
    );
  }
});
