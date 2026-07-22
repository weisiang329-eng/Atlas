/**
 * /v1/pending — the one list of what Atlas is waiting on.
 *
 * There were three: a section in HANDOFF, the source registry, and free text
 * inside each driver's `source_name`. Three lists is three chances to drift,
 * and they had: the registry said "awaiting key", a driver said "not yet
 * ingested", and HANDOFF said "blocked" — about the same thing, in different
 * words, with no way to tell what each one would actually unblock.
 *
 * This computes the list from the drivers themselves, grouped by BLOCKER, and
 * sorts by how much each item unblocks. The point of the ordering: a free key
 * that turns on four drivers outranks a subscription that turns on three, and
 * "someone has to write the extraction" outranks both because it is already
 * paid for.
 */
import { Hono } from "hono";
import { asc } from "drizzle-orm";
import type { Env } from "../index.ts";
import { createDb } from "../db/repo.ts";
import { industryDriver } from "../db/schema.ts";
import { DATA_SOURCES, SOURCE_BY_ID } from "../ingest/sources.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const pending = new Hono<AppEnv>();

/** Ordered by what the owner should do first — cheapest real progress first. */
const BLOCKER_ORDER = [
  "needs-extraction",
  "needs-coverage",
  "needs-key",
  "paid",
  "unavailable",
  "unclassified",
  "none",
] as const;

const BLOCKER_ACTION: Record<string, string> = {
  "needs-extraction":
    "No permission needed and nothing to buy — the numbers are already in financial_fact. Write the derivation.",
  "needs-coverage":
    "The data is free and public — in the filings of companies Atlas does not track yet. This is a coverage decision, not a purchase.",
  "needs-key": "Register a FREE key and run `wrangler secret put`.",
  paid: "Deliberately not bought. See the substitute named on the source.",
  unavailable:
    "Nobody publishes it at any price. Kept so the model states its own limits rather than looking complete.",
  unclassified: "Not yet triaged — classify it.",
  none: "Nothing pending; the driver has a series and is backtested.",
};

pending.get("/", async (c) => {
  const db = c.get("db");
  const drivers = await db
    .select()
    .from(industryDriver)
    .orderBy(asc(industryDriver.industryId), asc(industryDriver.key));

  const groups = new Map<
    string,
    { blocker: string; action: string; driverCount: number; sources: Map<string, string[]> }
  >();

  for (const d of drivers) {
    const blocker = d.blocker ?? "unclassified";
    const g =
      groups.get(blocker) ??
      {
        blocker,
        action: BLOCKER_ACTION[blocker] ?? "",
        driverCount: 0,
        sources: new Map<string, string[]>(),
      };
    g.driverCount += 1;
    const sourceId = d.sourceId ?? "unassigned";
    const list = g.sources.get(sourceId) ?? [];
    list.push(`${d.industryId}/${d.key}`);
    g.sources.set(sourceId, list);
    groups.set(blocker, g);
  }

  const shaped = BLOCKER_ORDER.filter((b) => groups.has(b)).map((b) => {
    const g = groups.get(b)!;
    return {
      blocker: g.blocker,
      action: g.action,
      driverCount: g.driverCount,
      sources: [...g.sources.entries()]
        .map(([sourceId, driverKeys]) => {
          const src = SOURCE_BY_ID.get(sourceId);
          return {
            sourceId,
            name: src?.name ?? sourceId,
            status: src?.status ?? null,
            secretName: src?.secretName ?? null,
            registerUrl: src?.registerUrl ?? null,
            steps: src?.steps ?? null,
            costNote: src?.costNote ?? null,
            /** What we use instead — resolved to names so the UI need not join. */
            substitutedBy:
              src?.substitutedBy?.map((id) => SOURCE_BY_ID.get(id)?.name ?? id) ?? null,
            rejectedReason: src?.rejectedReason ?? null,
            driverCount: driverKeys.length,
            drivers: driverKeys.sort(),
          };
        })
        // Most unblocked first: the ordering IS the recommendation.
        .sort((a, b2) => b2.driverCount - a.driverCount),
    };
  });

  // `c.env` is the Worker binding object; it is absent when the app is mounted
  // outside a Worker (tests, local harnesses), and reading through it blindly
  // turned a status endpoint into a 500.
  const env = (c.env ?? {}) as unknown as Record<string, string | undefined>;

  return c.json({
    /** Free keys nobody has registered — the cheapest unblocking there is. */
    freeKeysOutstanding: DATA_SOURCES.filter(
      (s) => s.status === "awaiting-key" && !env[s.secretName ?? ""],
    ).map((s) => ({
      id: s.id,
      name: s.name,
      secretName: s.secretName,
      registerUrl: s.registerUrl,
      serves: s.serves,
      priority: s.priority ?? 99,
    })),
    groups: shaped,
    totals: {
      drivers: drivers.length,
      blocked: drivers.filter((d) => (d.blocker ?? "unclassified") !== "none").length,
      testable: drivers.filter((d) => d.blocker === "none").length,
    },
  });
});
