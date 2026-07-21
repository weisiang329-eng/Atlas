/**
 * Atlas database schema (D1 / SQLite via Drizzle).
 *
 * Scope: the foundation + Financial Intelligence slice (P004). This lands the
 * core of the `database-v0.md` direction — Company, Industry, Financial and a
 * Source (provenance) spine — and deliberately stops there. Later programs
 * (Research, Scoring, Knowledge Graph, Intelligence) extend this file.
 *
 * Design principles carried from `schemas/database-v0.md`:
 *   - Every important value carries source metadata (see `source` + `sourceId`).
 *   - Financial statements are stored as canonical *facts* (concept -> value),
 *     not pre-rendered rows. The engine derives income/balance/cash-flow
 *     presentations, metrics and ratios from facts. This maps 1:1 onto XBRL
 *     tags when SEC EDGAR ingestion lands, and keeps the UI free of computation.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`);

/**
 * Provenance for every value in the system. A fact without a source is not
 * trustworthy; the UI labels data by its source kind.
 */
export const source = sqliteTable("source", {
  id: text("id").primaryKey(),
  /** 'seed' | 'sec-edgar' | 'manual' | 'estimate' — how the value was obtained. */
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
export const industry = sqliteTable("industry", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  description: text("description"),
  createdAt: createdAt(),
});

/**
 * The coverage universe. Fields mirror the frontend's `Company` contract
 * (id/name/ticker/exchange/segment/country) plus profile detail.
 */
export const company = sqliteTable(
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
      .default(sql`(CURRENT_TIMESTAMP)`),
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
export const financialPeriod = sqliteTable(
  "financial_period",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
export const financialFact = sqliteTable(
  "financial_fact",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    periodId: integer("period_id")
      .notNull()
      .references(() => financialPeriod.id, { onDelete: "cascade" }),
    concept: text("concept").notNull(),
    value: real("value").notNull(),
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

export type Source = typeof source.$inferSelect;
export type Industry = typeof industry.$inferSelect;
export type Company = typeof company.$inferSelect;
export type FinancialPeriod = typeof financialPeriod.$inferSelect;
export type FinancialFact = typeof financialFact.$inferSelect;
