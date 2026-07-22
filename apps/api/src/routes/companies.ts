/**
 * /v1/companies — the coverage universe and per-company financial intelligence.
 *
 * GET /                          list companies (frontend Company contract)
 * GET /:id                       company profile
 * GET /:id/financials            everything the Financials workspace needs in
 *                                one call: periods, statements, metrics,
 *                                ratio groups, trends (annual)
 * GET /:id/statements/:type      one statement (income-statement | balance-sheet | cash-flow)
 * GET /:id/metrics               key metric rows
 * GET /:id/ratios                grouped ratio dashboard (P004)
 * GET /:id/results?period=...    quarterly | annual results table rows
 */
import { Hono } from "hono";
import type { Env } from "../index.ts";
import { createDb, getCompany, getPeriodsWithFacts, listCompanies } from "../db/repo.ts";
import { isStatementType, renderStatement } from "../domain/statements.ts";
import {
  presentMetrics,
  presentRatioGroups,
  presentResults,
  presentTrends,
} from "../domain/presenters.ts";
import { computeScore } from "../domain/scoring.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const companies = new Hono<AppEnv>();

/** How many annual periods the statement/ratio views show (matches UI: 4 columns). */
const ANNUAL_VIEW_PERIODS = 4;

companies.get("/", async (c) => {
  const rows = await listCompanies(c.get("db"));
  return c.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      ticker: r.ticker,
      exchange: r.exchange,
      segment: r.segment,
      country: r.country,
    })),
  );
});

companies.get("/:id", async (c) => {
  const row = await getCompany(c.get("db"), c.req.param("id"));
  if (!row) return c.json({ error: "Company not found." }, 404);
  return c.json(row);
});

companies.get("/:id/financials", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const company = await getCompany(db, id);
  if (!company) return c.json({ error: "Company not found." }, 404);

  const annual = await getPeriodsWithFacts(db, id, "annual", ANNUAL_VIEW_PERIODS);
  if (annual.length === 0) {
    return c.json({ error: "No financial data available for this company." }, 404);
  }
  const labels = annual.map((p) => p.period.periodLabel);
  const facts = annual.map((p) => p.facts);
  const unit = annual[annual.length - 1]!.period.unit;
  const currency = annual[annual.length - 1]!.period.currency;

  return c.json({
    company: { id: company.id, name: company.name, ticker: company.ticker },
    periods: labels,
    unit,
    currency,
    statements: {
      incomeStatement: renderStatement("income-statement", facts),
      balanceSheet: renderStatement("balance-sheet", facts),
      cashFlow: renderStatement("cash-flow", facts),
    },
    metrics: presentMetrics(facts),
    ratioGroups: presentRatioGroups(facts),
    trends: presentTrends(labels, facts),
  });
});

companies.get("/:id/statements/:type", async (c) => {
  const type = c.req.param("type");
  if (!isStatementType(type)) {
    return c.json({ error: "Unknown statement type." }, 400);
  }
  const db = c.get("db");
  const id = c.req.param("id");
  const annual = await getPeriodsWithFacts(db, id, "annual", ANNUAL_VIEW_PERIODS);
  if (annual.length === 0) return c.json({ error: "No financial data available." }, 404);
  return c.json({
    periods: annual.map((p) => p.period.periodLabel),
    rows: renderStatement(type, annual.map((p) => p.facts)),
  });
});

companies.get("/:id/metrics", async (c) => {
  const annual = await getPeriodsWithFacts(
    c.get("db"),
    c.req.param("id"),
    "annual",
    ANNUAL_VIEW_PERIODS,
  );
  if (annual.length === 0) return c.json({ error: "No financial data available." }, 404);
  return c.json(presentMetrics(annual.map((p) => p.facts)));
});

companies.get("/:id/ratios", async (c) => {
  const annual = await getPeriodsWithFacts(
    c.get("db"),
    c.req.param("id"),
    "annual",
    ANNUAL_VIEW_PERIODS,
  );
  if (annual.length === 0) return c.json({ error: "No financial data available." }, 404);
  return c.json(presentRatioGroups(annual.map((p) => p.facts)));
});

companies.get("/:id/score", async (c) => {
  const annual = await getPeriodsWithFacts(
    c.get("db"),
    c.req.param("id"),
    "annual",
    ANNUAL_VIEW_PERIODS,
  );
  if (annual.length === 0) return c.json({ error: "No financial data to score." }, 404);
  const latest = annual[annual.length - 1]!.period.periodLabel;
  return c.json(computeScore(annual.map((p) => p.facts), latest));
});

companies.get("/:id/results", async (c) => {
  const periodType = c.req.query("period") === "quarter" ? "quarter" : "annual";
  const rows = await getPeriodsWithFacts(c.get("db"), c.req.param("id"), periodType);
  if (rows.length === 0) return c.json({ error: "No results available." }, 404);
  return c.json(
    presentResults(
      rows.map((p) => p.period.periodLabel),
      rows.map((p) => p.facts),
    ),
  );
});
