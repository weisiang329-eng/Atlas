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
  listIndustries,
  listIndustryMetrics,
} from "../db/repo.ts";
import { buildCycleSignal, buildMetricSeries } from "../domain/industry.ts";
import { computeScore } from "../domain/scoring.ts";
import {
  buildTaxonomy,
  pathOf,
  rollUpMembers,
  type TaxonomyRow,
} from "../domain/taxonomy.ts";
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

  // Membership rolls UP the tree: a company is filed on one node, but a reader
  // asks "how is 半导体 doing" at every node. Without this a parent renders
  // empty while its children hold the entire universe.
  const membersById = rollUpMembers(rows, companies);

  return c.json(
    rows.map((ind) => {
      const rolled = new Set(membersById.get(ind.id) ?? []);
      const members = scored.filter((s) => rolled.has(s.co.id));
      const withScore = members.filter((m) => m.atlasScore !== null);
      const best = withScore.reduce<(typeof withScore)[number] | null>(
        (a, b) => (a === null || (b.atlasScore ?? 0) > (a.atlasScore ?? 0) ? b : a),
        null,
      );
      const series = seriesById.get(ind.id) ?? [];
      const cycle = buildCycleSignal(series);

      return {
        ...ind,
        // Root → this node. The UI renders the nesting; it never renders
        // `level`, which is schema vocabulary (INDUSTRY-INTELLIGENCE §1).
        path: pathOf(rows, ind.id).map((n) => ({
          id: n.id,
          name: n.name,
          nameZh: n.nameZh,
        })),
        directCompanyCount: companies.filter((co) => co.industryId === ind.id)
          .length,
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

/**
 * GET /v1/industries/tree — the taxonomy, nested, with rolled-up membership.
 *
 * Separate from `/` because the flat list answers "show me every node" while
 * this answers "show me the structure", and a client that wants the structure
 * should not have to rebuild it from parent ids. Placed before /:id so "tree"
 * is not read as an industry id.
 */
industries.get("/tree", async (c) => {
  const db = c.get("db");
  const [rows, companies] = await Promise.all([
    listIndustries(db),
    listCompanies(db),
  ]);
  const members = rollUpMembers(rows, companies);

  type TreeDto = {
    id: string;
    name: string;
    nameZh: string | null;
    companyCount: number;
    directCompanyCount: number;
    children: TreeDto[];
  };

  const directCount = new Map<string, number>();
  for (const co of companies) {
    if (!co.industryId) continue;
    directCount.set(co.industryId, (directCount.get(co.industryId) ?? 0) + 1);
  }

  const shape = (node: ReturnType<typeof buildTaxonomy>[number]): TreeDto => ({
    id: node.id,
    name: node.name,
    nameZh: node.nameZh,
    companyCount: (members.get(node.id) ?? []).length,
    directCompanyCount: directCount.get(node.id) ?? 0,
    children: node.children.map(shape),
  });

  return c.json({ roots: buildTaxonomy(rows).map(shape) });
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

  const [allIndustries, allCompanies, metricRows] = await Promise.all([
    listIndustries(db),
    listCompanies(db),
    listIndustryMetrics(db, id),
  ]);
  const series = buildMetricSeries(metricRows);

  // Members roll up: 半导体 shows everyone under 存储/代工/设备. Without this
  // every node above a leaf reads as an empty industry.
  const memberIds = new Set(rollUpMembers(allIndustries, allCompanies).get(id) ?? []);
  const companies = allCompanies.filter((co) => memberIds.has(co.id));
  const children = allIndustries
    .filter((i) => i.parentId === id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return c.json({
    id: industry.id,
    name: industry.name,
    nameZh: industry.nameZh,
    sector: industry.sector,
    description: industry.description,
    /** Root → this node. The breadcrumb; the UI never prints `level`. */
    path: pathOf(allIndustries as TaxonomyRow[], id).map((n) => ({
      id: n.id,
      name: n.name,
      nameZh: n.nameZh,
    })),
    children: children.map((ch) => ({
      id: ch.id,
      name: ch.name,
      nameZh: ch.nameZh,
      companyCount: allCompanies.filter((co) => co.industryId === ch.id).length,
    })),
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
