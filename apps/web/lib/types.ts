/**
 * API contract types — mirrors of the Atlas API (apps/api) response shapes.
 *
 * These are the frontend's copy of the wire contracts. If a shape changes
 * here, it changed in apps/api/src/domain/presenters.ts first; keep them in
 * lock-step. Display components import from here (not from lib/mock/*) so
 * mock and live data flow through identical types.
 */
import type { StatementRow } from "@/components/data/statement-table";
import type { SeriesPoint } from "@/components/chart/trend-chart";
import type { KpiDirection } from "@/components/ui/kpi-card";

/** GET /v1/companies — one row of the coverage universe. */
export interface CompanySummary {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  segment: string;
  country: string;
}

/** GET /v1/companies/:id — full profile row. */
export interface CompanyProfile extends CompanySummary {
  industryId: string | null;
  description: string | null;
  headquarters: string | null;
  foundedYear: number | null;
  website: string | null;
  reportingCurrency: string;
}

/** GET /v1/companies/:id/statements/:type */
export interface StatementPayload {
  periods: string[];
  rows: StatementRow[];
}

/** GET /v1/companies/:id/metrics — one key-metric row. */
export interface MetricRow {
  label: string;
  latest: string;
  series: number[];
}

export interface Ratio {
  label: string;
  value: string;
  delta?: string;
  direction?: KpiDirection;
  series?: number[];
}

/** GET /v1/companies/:id/ratios — one dashboard group. */
export interface RatioGroup {
  title: string;
  description: string;
  ratios: Ratio[];
}

/** GET /v1/companies/:id/results — one results-table row. Values may be null. */
export interface ResultRow {
  id: string;
  period: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
}

export interface TrendsPayload {
  revenue: SeriesPoint[];
  netIncome: SeriesPoint[];
  freeCashFlow: SeriesPoint[];
}

// --- Atlas Score (P010) -----------------------------------------------------

export interface ScoreMetric {
  label: string;
  value: string;
  score: number;
}

export interface FactorScore {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  rationale: string;
  metrics: ScoreMetric[];
}

/** GET /v1/companies/:id/score */
export interface ScoreResult {
  atlasScore: number | null;
  grade: string;
  asOf: string | null;
  factors: FactorScore[];
  note: string;
}

/** GET /v1/scores — one leaderboard row. */
export interface ScoreRow {
  id: string;
  name: string;
  ticker: string;
  segment: string;
  country: string;
  atlasScore: number | null;
  grade: string;
  asOf: string | null;
  factors: Record<string, number | null>;
}

/** A point in an industry metric or cycle-signal series. */
export interface IndustrySeriesPoint {
  date: string;
  value: number;
  note?: string;
}

/** One industry-level series (cost / price / capacity), with cycle stats. */
export interface MetricSeries {
  key: string;
  label: string;
  kind: string;
  unit: string;
  points: IndustrySeriesPoint[];
  latest: number | null;
  latestDate: string | null;
  changeYoYPct: number | null;
}

export interface CycleSignal {
  label: string;
  unit: string;
  points: IndustrySeriesPoint[];
  latest: number | null;
  changeYoYPct: number | null;
}

/** GET /v1/industries/:id — industry workspace payload. */
export interface IndustryDetail {
  id: string;
  name: string;
  sector: string;
  description: string | null;
  companies: CompanySummary[];
  series: MetricSeries[];
  cycleSignal: CycleSignal | null;
}

/** GET /v1/companies/:id/financials — the whole workspace in one call. */
export interface CompanyFinancials {
  company: { id: string; name: string; ticker: string };
  periods: string[];
  unit: string;
  currency: string;
  statements: {
    incomeStatement: StatementRow[];
    balanceSheet: StatementRow[];
    cashFlow: StatementRow[];
  };
  metrics: MetricRow[];
  ratioGroups: RatioGroup[];
  trends: TrendsPayload;
}
