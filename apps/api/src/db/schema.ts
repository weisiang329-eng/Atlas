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
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
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
  /** Chinese name. The app defaults to zh and a taxonomy is data, not UI copy. */
  nameZh: text("name_zh"),
  sector: text("sector").notNull(),
  /**
   * Parent node in the taxonomy; null at the root.
   *
   * The tree exists so drivers can hang off DRIVER-HOMOGENEOUS leaves: HBM is
   * bound to AI capex and CoWoS allocation while commodity DRAM follows phone
   * and PC demand, so averaging them produces a curve that describes neither.
   * See docs/INDUSTRY-INTELLIGENCE.md §1.
   */
  parentId: text("parent_id"),
  /**
   * Depth, 1 at the root. **Schema vocabulary only — never a UI label.** The
   * nesting conveys depth on screen (科技 › 半导体 › 存储 › DRAM); printing
   * "L4" leaks the schema and invites "why does this branch have an extra
   * level", whose honest answer is that depth is uneven by design.
   */
  level: integer("level"),
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

/* ═══════════════════════════════════════════════════════════════════════
 * Portfolio accounting / trade book (PMS)
 * Model: docs/PORTFOLIO-ACCOUNTING.md
 * Trades are immutable events; lots carry cost; closures record per-order
 * realized P&L; positions are derived on read, never stored.
 * ═══════════════════════════════════════════════════════════════════════ */

export const pmsAccount = pgTable("pms_account", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  broker: text("broker").notNull(),
  accountType: text("account_type").notNull().default("cash"),
  /** fifo | lifo | hifo | strict — see domain/matching.ts. */
  bookingMethod: text("booking_method").notNull().default("fifo"),
  baseCurrency: text("base_currency").notNull().default("MYR"),
  externalId: text("external_id"),
  createdAt: createdAt(),
});

export const pmsInstrument = pgTable(
  "pms_instrument",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    market: text("market").$type<"US" | "MY" | "HK" | "SG">().notNull(),
    currency: text("currency").notNull(),
    name: text("name").notNull(),
    companyId: text("company_id").references(() => company.id),
    createdAt: createdAt(),
  },
  (t) => ({
    symbolMarketUnq: uniqueIndex("pms_instrument_symbol_market_unq").on(
      t.symbol,
      t.market,
    ),
  }),
);

export const pmsFxRate = pgTable(
  "pms_fx_rate",
  {
    rateDate: date("rate_date").notNull(),
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    rate: doublePrecision("rate").notNull(),
    /** Half the dealer buy/sell spread as a % of mid — the conversion cost. */
    halfSpreadPct: doublePrecision("half_spread_pct"),
    provider: text("provider"),
    sourceId: text("source_id").references(() => source.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.rateDate, t.fromCurrency, t.toCurrency] }),
  }),
);

export const pmsTrade = pgTable(
  "pms_trade",
  {
    id: serial("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => pmsAccount.id, { onDelete: "cascade" }),
    instrumentId: text("instrument_id")
      .notNull()
      .references(() => pmsInstrument.id),
    side: text("side").$type<"buy" | "sell">().notNull(),
    quantity: doublePrecision("quantity").notNull(),
    price: doublePrecision("price").notNull(),
    currency: text("currency").notNull(),
    /** Trade currency -> account base currency, at trade date. */
    fxRate: doublePrecision("fx_rate").notNull().default(1),
    tradedAt: text("traded_at").notNull(),
    settledOn: date("settled_on"),
    note: text("note"),
    sourceKind: text("source_kind").notNull().default("manual"),
    externalOrderId: text("external_order_id"),
    /** Broker deal id — the idempotency key for imports. */
    externalDealId: text("external_deal_id"),
    createdAt: createdAt(),
  },
  (t) => ({
    dealUnq: uniqueIndex("pms_trade_deal_unq").on(t.accountId, t.externalDealId),
    acctInstIdx: index("pms_trade_acct_inst_idx").on(
      t.accountId,
      t.instrumentId,
      t.tradedAt,
    ),
  }),
);

export const pmsTradeFee = pgTable(
  "pms_trade_fee",
  {
    id: serial("id").primaryKey(),
    tradeId: integer("trade_id")
      .notNull()
      .references(() => pmsTrade.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    amount: doublePrecision("amount").notNull(),
    currency: text("currency").notNull(),
    /** 'estimated' from the schedule, or 'actual' once reconciled. */
    basis: text("basis").notNull().default("estimated"),
    createdAt: createdAt(),
  },
  (t) => ({
    tradeIdx: index("pms_trade_fee_trade_idx").on(t.tradeId),
  }),
);

export const pmsLot = pgTable(
  "pms_lot",
  {
    id: serial("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => pmsAccount.id, { onDelete: "cascade" }),
    instrumentId: text("instrument_id")
      .notNull()
      .references(() => pmsInstrument.id),
    tradeId: integer("trade_id")
      .notNull()
      .references(() => pmsTrade.id, { onDelete: "cascade" }),
    openedAt: text("opened_at").notNull(),
    originalQty: doublePrecision("original_qty").notNull(),
    remainingQty: doublePrecision("remaining_qty").notNull(),
    costPrice: doublePrecision("cost_price").notNull(),
    feesTotal: doublePrecision("fees_total").notNull().default(0),
    currency: text("currency").notNull(),
    fxRate: doublePrecision("fx_rate").notNull().default(1),
    /** Human label — the foolproof handle for specific-lot selling. */
    label: text("label"),
  },
  (t) => ({
    tradeUnq: uniqueIndex("pms_lot_trade_unq").on(t.tradeId),
    openIdx: index("pms_lot_open_idx").on(
      t.accountId,
      t.instrumentId,
      t.openedAt,
    ),
  }),
);

export const pmsLotClosure = pgTable(
  "pms_lot_closure",
  {
    id: serial("id").primaryKey(),
    lotId: integer("lot_id")
      .notNull()
      .references(() => pmsLot.id, { onDelete: "cascade" }),
    sellTradeId: integer("sell_trade_id")
      .notNull()
      .references(() => pmsTrade.id, { onDelete: "cascade" }),
    closedAt: text("closed_at").notNull(),
    quantity: doublePrecision("quantity").notNull(),
    costPrice: doublePrecision("cost_price").notNull(),
    sellPrice: doublePrecision("sell_price").notNull(),
    feesLocal: doublePrecision("fees_local").notNull().default(0),
    grossPlLocal: doublePrecision("gross_pl_local").notNull(),
    netPlLocal: doublePrecision("net_pl_local").notNull(),
    currency: text("currency").notNull(),
    buyFxRate: doublePrecision("buy_fx_rate").notNull(),
    sellFxRate: doublePrecision("sell_fx_rate").notNull(),
    totalPlBase: doublePrecision("total_pl_base").notNull(),
    pricePlBase: doublePrecision("price_pl_base").notNull(),
    fxPlBase: doublePrecision("fx_pl_base").notNull(),
    netPlBase: doublePrecision("net_pl_base").notNull(),
    createdAt: createdAt(),
  },
  (t) => ({
    closureUnq: uniqueIndex("pms_closure_unq").on(t.lotId, t.sellTradeId),
    sellIdx: index("pms_closure_sell_idx").on(t.sellTradeId),
  }),
);

export const pmsCashMovement = pgTable(
  "pms_cash_movement",
  {
    id: serial("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => pmsAccount.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    /** Signed: positive is money in, negative is money out. */
    amount: doublePrecision("amount").notNull(),
    currency: text("currency").notNull(),
    fxRate: doublePrecision("fx_rate").notNull().default(1),
    occurredOn: date("occurred_on").notNull(),
    instrumentId: text("instrument_id").references(() => pmsInstrument.id),
    note: text("note"),
    sourceKind: text("source_kind").notNull().default("manual"),
    externalId: text("external_id"),
    createdAt: createdAt(),
  },
  (t) => ({
    acctIdx: index("pms_cash_acct_idx").on(t.accountId, t.occurredOn),
  }),
);

export type PmsAccount = typeof pmsAccount.$inferSelect;
export type PmsInstrument = typeof pmsInstrument.$inferSelect;
export type PmsTrade = typeof pmsTrade.$inferSelect;
export type PmsTradeFee = typeof pmsTradeFee.$inferSelect;
export type PmsLot = typeof pmsLot.$inferSelect;
export type PmsLotClosure = typeof pmsLotClosure.$inferSelect;
export type PmsCashMovement = typeof pmsCashMovement.$inferSelect;

/* ═══════════════════════════════════════════════════════════════════════
 * Agent Console — runtime + governance
 * Ported from the Hookka ERP agent console. `phase` is the autonomy dial:
 * 1 propose · 2 auto-tune · 3 full-auto. Autonomy is granted, never assumed.
 * ═══════════════════════════════════════════════════════════════════════ */

export const agentRun = pgTable(
  "agent_run",
  {
    id: text("id").primaryKey(),
    agent: text("agent").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").$type<"running" | "ok" | "error">().notNull().default("running"),
    request: text("request"),
    summary: text("summary"),
    output: text("output"),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    error: text("error"),
  },
  (t) => ({
    agentIdx: index("agent_run_agent_idx").on(t.agent, t.startedAt),
  }),
);

export const agentControl = pgTable("agent_control", {
  agent: text("agent").primaryKey(),
  paused: boolean("paused").notNull().default(false),
  /** 1 propose · 2 auto-tune · 3 full-auto. */
  phase: integer("phase").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AgentRun = typeof agentRun.$inferSelect;
export type AgentControl = typeof agentControl.$inferSelect;

/* ═══════════════════════════════════════════════════════════════════════
 * Industry knowledge (Atlas OS V1 Book 2)
 * Twenty mandated sections per industry, each record carrying its own
 * provenance. Conflicting values are stored with attribution, never resolved
 * silently — the disagreement is itself information.
 * ═══════════════════════════════════════════════════════════════════════ */

export const industryKnowledge = pgTable(
  "industry_knowledge",
  {
    id: serial("id").primaryKey(),
    industryId: text("industry_id")
      .notNull()
      .references(() => industry.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    content: text("content").notNull(),
    kind: text("kind").$type<"fact" | "assumption">().notNull().default("fact"),
    sourceId: text("source_id").references(() => source.id),
    sourceUrl: text("source_url"),
    confidence: doublePrecision("confidence").notNull().default(1),
    asOf: date("as_of"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idx: index("industry_knowledge_idx").on(t.industryId, t.section),
  }),
);

export const industryKpi = pgTable(
  "industry_kpi",
  {
    id: serial("id").primaryKey(),
    industryId: text("industry_id")
      .notNull()
      .references(() => industry.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    definition: text("definition").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    unit: text("unit"),
    signalType: text("signal_type").$type<"leading" | "lagging">().notNull().default("lagging"),
    updateFrequency: text("update_frequency"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    affectedCompanies: text("affected_companies"),
    affectedProducts: text("affected_products"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("industry_kpi_unq").on(t.industryId, t.key),
  }),
);

export type IndustryKnowledge = typeof industryKnowledge.$inferSelect;
export type IndustryKpi = typeof industryKpi.$inferSelect;

/* ═══════════════════════════════════════════════════════════════════════
 * News monitoring (free sources)
 * A headline is a monitoring signal, never a source of record for a number.
 * ═══════════════════════════════════════════════════════════════════════ */

export const newsItem = pgTable(
  "news_item",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    publisher: text("publisher"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    query: text("query"),
    companyIds: text("company_ids"),
    industryIds: text("industry_ids"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    publishedIdx: index("news_item_published_idx").on(t.publishedAt),
  }),
);

export type NewsItem = typeof newsItem.$inferSelect;
