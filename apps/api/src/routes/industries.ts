/**
 * /v1/industries — the sector taxonomy and industry intelligence.
 *
 * GET /             list industries
 * GET /:id          industry detail: profile + member companies + metric
 *                   series (cost/price) + derived cycle signal
 * GET /:id/metrics  just the metric series (charts that poll independently)
 */
import { Hono } from "hono";
import type { Env } from "../index";
import {
  createDb,
  getIndustry,
  listCompaniesByIndustry,
  listIndustries,
  listIndustryMetrics,
} from "../db/repo";
import { buildCycleSignal, buildMetricSeries } from "../domain/industry";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const industries = new Hono<AppEnv>();

industries.get("/", async (c) => {
  const rows = await listIndustries(c.get("db"));
  return c.json(rows);
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
