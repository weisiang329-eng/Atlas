/**
 * /v1/industries — the sector taxonomy and industry intelligence.
 *
 * GET /             list industries
 * GET /:id          industry detail: profile + member companies + metric
 *                   series (cost/price) + derived cycle signal
 * GET /:id/metrics  just the metric series (charts that poll independently)
 */
import { Hono } from "hono";
import type { Env } from "../index.ts";
import {
  createDb,
  getIndustry,
  getPeriodsWithFacts,
  listAllRelationships,
  listCompanies,
  listCompaniesByIndustry,
  listIndustries,
  listIndustryMetrics,
} from "../db/repo.ts";
import { buildCycleSignal, buildMetricSeries } from "../domain/industry.ts";
import { computeScore } from "../domain/scoring.ts";
import { buildValueChain } from "../domain/valuechain.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const industries = new Hono<AppEnv>();

/**
 * The list endpoint used to return the bare taxonomy row — id, name, sector —
 * which gave the industries page nothing to render but a wall of links. Every
 * figure below already exists in the database; it was simply never aggregated,
 * so the screen looked empty while the data sat one join away.
 *
 * Aggregates are computed from the same `computeScore` used by /v1/scores, so
 * an industry's average can never disagree with the leaderboard it summarises.
 */
industries.get("/", async (c) => {
  const db = c.get("db");
  const [rows, companies] = await Promise.all([
    listIndustries(db),
    listCompanies(db),
  ]);

  // Score the whole universe once, then group — not once per industry.
  const scored = await Promise.all(
    companies.map(async (co) => {
      const annual = await getPeriodsWithFacts(db, co.id, "annual", 4);
      const latest = annual[annual.length - 1]?.period.periodLabel ?? null;
      const { atlasScore, grade } = computeScore(annual.map((p) => p.facts), latest);
      return { co, atlasScore, grade };
    }),
  );

  const metrics = await Promise.all(
    rows.map(async (ind) => ({
      id: ind.id,
      series: buildMetricSeries(await listIndustryMetrics(db, ind.id)),
    })),
  );
  const seriesById = new Map(metrics.map((m) => [m.id, m.series]));

  return c.json(
    rows.map((ind) => {
      const members = scored.filter((s) => s.co.industryId === ind.id);
      const withScore = members.filter((m) => m.atlasScore !== null);
      const best = withScore.reduce<(typeof withScore)[number] | null>(
        (a, b) => (a === null || (b.atlasScore ?? 0) > (a.atlasScore ?? 0) ? b : a),
        null,
      );
      const series = seriesById.get(ind.id) ?? [];
      const cycle = buildCycleSignal(series);

      return {
        ...ind,
        companyCount: members.length,
        scoredCount: withScore.length,
        avgScore:
          withScore.length === 0
            ? null
            : Math.round(
                withScore.reduce((sum, m) => sum + (m.atlasScore ?? 0), 0) /
                  withScore.length,
              ),
        topScore: best?.atlasScore ?? null,
        topCompany: best ? { id: best.co.id, name: best.co.name, ticker: best.co.ticker } : null,
        tickers: members.map((m) => m.co.ticker),
        seriesCount: series.length,
        // Enough points for a sparkline, not the full history — the detail
        // page owns the full series.
        cycle: cycle
          ? {
              latest: cycle.latest,
              changeYoYPct: cycle.changeYoYPct,
              points: cycle.points.slice(-24).map((p) => p.value),
            }
          : null,
      };
    }),
  );
});

// The value chain across staged industries (upstream -> downstream). Placed
// before /:id so "value-chain" is not read as an industry id.
industries.get("/value-chain", async (c) => {
  const db = c.get("db");
  const [inds, companies, rels] = await Promise.all([
    listIndustries(db),
    listCompanies(db),
    listAllRelationships(db),
  ]);
  return c.json(buildValueChain(inds, companies, rels));
});

industries.get("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const industry = await getIndustry(db, id);
  if (!industry) return c.json({ error: "Industry not found." }, 404);

  const [companies, metricRows] = await Promise.all([
    listCompaniesByIndustry(db, id),
    listIndustryMetrics(db, id),
  ]);
  const series = buildMetricSeries(metricRows);

  return c.json({
    id: industry.id,
    name: industry.name,
    sector: industry.sector,
    description: industry.description,
    companies: companies.map((co) => ({
      id: co.id,
      name: co.name,
      ticker: co.ticker,
      exchange: co.exchange,
      segment: co.segment,
      country: co.country,
    })),
    series,
    cycleSignal: buildCycleSignal(series),
  });
});

industries.get("/:id/metrics", async (c) => {
  const rows = await listIndustryMetrics(c.get("db"), c.req.param("id"));
  if (rows.length === 0) {
    return c.json({ error: "No industry metrics available." }, 404);
  }
  return c.json(buildMetricSeries(rows));
});
