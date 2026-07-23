/**
 * /v1/scores — the Atlas Score leaderboard across the coverage universe.
 *
 * Scores every company from its annual facts and returns them ranked. N+1
 * over the universe is fine at this scale (tens of companies); if coverage
 * grows large this becomes a single windowed query.
 */
import { Hono } from "hono";
import type { Env } from "../index.ts";
import { createDb, getPeriodsWithFacts, listCompanies } from "../db/repo.ts";
import { computeScore } from "../domain/scoring.ts";
import {
  computePercentiles,
  type ScoredEntity,
} from "../domain/percentile.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const scores = new Hono<AppEnv>();

scores.get("/", async (c) => {
  const db = c.get("db");
  const companies = await listCompanies(db);

  const rows = await Promise.all(
    companies.map(async (co) => {
      const annual = await getPeriodsWithFacts(db, co.id, "annual", 4);
      const latest = annual[annual.length - 1]?.period.periodLabel ?? null;
      const result = computeScore(annual.map((p) => p.facts), latest);
      const factors = Object.fromEntries(
        result.factors.map((f) => [f.key, f.score === null ? null : Math.round(f.score)]),
      );
      return {
        id: co.id,
        name: co.name,
        ticker: co.ticker,
        segment: co.segment,
        country: co.country,
        atlasScore: result.atlasScore,
        grade: result.grade,
        asOf: result.asOf,
        factors,
      };
    }),
  );

  // P010 v2 — the RELATIVE lens, computed across the whole universe at once
  // (the absolute atlasScore above is untouched). Kept in the domain layer:
  // the route ranks nothing itself, it hands the scores to computePercentiles.
  const entities: ScoredEntity[] = rows.map((r) => ({
    id: r.id,
    composite: r.atlasScore,
    factors: r.factors,
  }));
  const percentiles = computePercentiles(entities);
  const withPercentiles = rows.map((r) => ({
    ...r,
    percentile: percentiles.get(r.id) ?? null,
  }));

  // Ranked: scored companies first (desc), then unscored.
  withPercentiles.sort((a, b) => (b.atlasScore ?? -1) - (a.atlasScore ?? -1));
  return c.json(withPercentiles);
});
