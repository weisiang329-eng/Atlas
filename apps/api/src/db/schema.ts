/**
 * Atlas database schema (Postgres / Supabase via Drizzle).
 *
 * Scope: the foundation + Financial Intelligence slice (P004) and everything
 * built on it (Industry, Knowledge Graph). Financial statements are stored as
 * canonical *facts* (concept -> value); the engine derives statements, metrics
 * and ratios from them (see domain/*). Every value carries a `source`.
 *
 * Postgres notes: integer primary keys are `serial` (identity); seeds insert
 * by natural key and let ids auto-assign, so the seeds stay idempotent and
 * re-runnable. `real` in SQLite became `doublePrecision` (float8) to keep
 * financial magnitudes exact enough for display.
 */
import { sql } from "drizzle-orm";
import {
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(now())::text`);

/**
 * Provenance for every value in the system. A fact without a source is not
 * trustworthy; the UI labels data by its source kind.
 */
export const source = pgTable("source", {
  id: text("id").primaryKey(),
  /** 'seed' | 'sec-edgar' | 'glove-tracker' | 'manual' | 'estimate'. */
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  /** ISO date the value was retrieved / asserted. */
  retrievedAt: text("retrieved_at"),
  note: text("note"),
  createdAt: createdAt(),
});

/**
 * Industry taxonomy. `sector` is the broad grouping (e.g. "Semiconductors"),
 * `id`/`name` the specific segment (e.g. "GPU / AI Accelerators").
 */
export const industry = pgTable("industry", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  description: text("description"),
  /**
   * Position in the sector's value chain (1 = upstream). Industries sharing a
   * chain are ordered by this; null = not placed on a chain (single-stage).
   */
  chainOrder: integer("chain_order"),
  createdAt: createdAt(),
});

/**
 * The coverage universe. Fields mirror the frontend's `Company` contract
 * (id/name/ticker/exchange/segment/country) plus profile detail.
 */
export const company = pgTable(
  "company",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ticker: text("ticker").notNull(),
    exchange: text("exchange").notNull(),
    /** Human-readable segment label shown in the UI (denormalised for display). */
    segment: text("segment").notNull(),
    country: text("country").notNull(),
    industryId: text("industry_id").references(() => industry.id),
    description: text("description"),
    headquarters: text("headquarters"),
    foundedYear: integer("founded_year"),
    website: text("website"),
    /** Reporting currency for this company's financials, e.g. "USD". */
    reportingCurrency: text("reporting_currency").notNull().default("USD"),
    createdAt: createdAt(),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(now())::text`),
  },
  (t) => ({
    tickerIdx: index("company_ticker_idx").on(t.ticker),
    industryIdx: index("company_industry_idx").on(t.industryId),
  }),
);

/**
 * One reporting period of financials for a company (a fiscal year or quarter).
 * Facts hang off this row.
 */
export const financialPeriod = pgTable(
  "financial_period",
  {
    id: serial("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    /** Display label, e.g. "FY24" or "Q3 FY24". */
    periodLabel: text("period_label").notNull(),
    /** 'annual' | 'quarter'. */
    periodType: text("period_type").$type<"annual" | "quarter">().notNull(),
    fiscalYear: integer("fiscal_year").notNull(),
    /** 1-4 for quarterly periods; null for annual. */
    fiscalQuarter: integer("fiscal_quarter"),
    currency: text("currency").notNull().default("USD"),
    /** Reporting unit for fact values, e.g. "millions". */
    unit: text("unit").notNull().default("millions"),
    /** ISO date the period was reported (period end / filing date). */
    reportDate: text("report_date"),
    sourceId: text("source_id").references(() => source.id),
    createdAt: createdAt(),
  },
  (t) => ({
    companyPeriodUnq: uniqueIndex("financial_period_company_label_unq").on(
      t.companyId,
      t.periodLabel,
    ),
    companyTypeYearIdx: index("financial_period_company_type_year_idx").on(
      t.companyId,
      t.periodType,
      t.fiscalYear,
    ),
  }),
);

/**
 * A single canonical financial value for a period. `concept` is a stable key
 * from the concept catalog (see domain/concepts.ts) such as "Revenue",
 * "NetIncome", "TotalAssets". Values are in the period's `unit`/`currency`.
 */
export const financialFact = pgTable(
  "financial_fact",
  {
    id: serial("id").primaryKey(),
    periodId: integer("period_id")
      .notNull()
      .references(() => financialPeriod.id, { onDelete: "cascade" }),
    concept: text("concept").notNull(),
    value: doublePrecision("value").notNull(),
    sourceId: text("source_id").references(() => source.id),
    createdAt: createdAt(),
  },
  (t) => ({
    periodConceptUnq: uniqueIndex("financial_fact_period_concept_unq").on(
      t.periodId,
      t.concept,
    ),
  }),
);

/**
 * Industry-level time series — cost factors (NBR latex), output prices
 * (MARGMA glove ASP), capacity/utilisation benchmarks. Cycle-signal inputs:
 * an industry's fortunes turn on the spread between output price and input
 * cost. One flexible series table keyed by `metricKey`.
 */
export const industryMetric = pgTable(
  "industry_metric",
  {
    id: serial("id").primaryKey(),
    industryId: text("industry_id")
      .notNull()
      .references(() => industry.id, { onDelete: "cascade" }),
    /** Stable series key, e.g. "asp_my", "nbr_latex". */
    metricKey: text("metric_key").notNull(),
    label: text("label").notNull(),
    /** 'cost' | 'price' | 'capacity' | 'utilisation' — how to read the series. */
    kind: text("kind").notNull().default("price"),
    observationDate: text("observation_date").notNull(),
    value: doublePrecision("value").notNull(),
    unit: text("unit").notNull(),
    note: text("note"),
    sourceId: text("source_id").references(() => source.id),
    createdAt: createdAt(),
  },
  (t) => ({
    seriesDateUnq: uniqueIndex("industry_metric_series_date_unq").on(
      t.industryId,
      t.metricKey,
      t.observationDate,
    ),
    industryKeyIdx: index("industry_metric_industry_key_idx").on(
      t.industryId,
      t.metricKey,
    ),
  }),
);

/**
 * Directed relationship between two companies (the knowledge-graph edge set,
 * P007). `relationType` is directional:
 *   - "supplies"       from → to  (from is a supplier of to; to is a customer)
 *   - "competes_with"  symmetric
 */
export const relationship = pgTable(
  "relationship",
  {
    id: serial("id").primaryKey(),
    fromId: text("from_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    toId: text("to_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    relationType: text("relation_type")
      .$type<"supplies" | "competes_with">()
      .notNull(),
    /** Short qualifier shown on the edge, e.g. "foundry", "HBM". */
    label: text("label"),
    note: text("note"),
    sourceId: text("source_id").references(() => source.id),
    createdAt: createdAt(),
  },
  (t) => ({
    edgeUnq: uniqueIndex("relationship_edge_unq").on(
      t.fromId,
      t.toId,
      t.relationType,
    ),
    fromIdx: index("relationship_from_idx").on(t.fromId),
    toIdx: index("relationship_to_idx").on(t.toId),
  }),
);

/**
 * Agent usage metering (launch hardening): one row per caller IP per day.
 * /v1/agent/ask increments and enforces the daily limit before calling Claude.
 */
export const agentUsage = pgTable(
  "agent_usage",
  {
    ip: text("ip").notNull(),
    day: date("day")
      .notNull()
      .default(sql`CURRENT_DATE`),
    count: integer("count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ip, t.day] }),
  }),
);

export type Source = typeof source.$inferSelect;
export type Industry = typeof industry.$inferSelect;
export type Company = typeof company.$inferSelect;
export type FinancialPeriod = typeof financialPeriod.$inferSelect;
export type FinancialFact = typeof financialFact.$inferSelect;
export type IndustryMetric = typeof industryMetric.$inferSelect;
export type Relationship = typeof relationship.$inferSelect;
