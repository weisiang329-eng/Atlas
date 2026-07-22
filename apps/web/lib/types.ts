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

// --- Agent (P020) -----------------------------------------------------------

export interface AgentTrace {
  tool: string;
  input: unknown;
}

/** POST /v1/agent/ask response. */
export interface AgentResult {
  answer: string;
  trace: AgentTrace[];
  steps: number;
  stopReason: string;
}

export interface AgentStatus {
  configured: boolean;
  model: string;
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

// --- Value chain (P006) -----------------------------------------------------

export interface ChainStage {
  industryId: string;
  name: string;
  sector: string;
  order: number;
  companies: { id: string; name: string; ticker: string }[];
}

export interface ChainEdge {
  fromStage: string;
  toStage: string;
  fromCompany: string;
  toCompany: string;
  label: string | null;
}

/** GET /v1/industries/value-chain */
export interface ValueChain {
  stages: ChainStage[];
  edges: ChainEdge[];
}

/** GET /v1/industries/:id — industry workspace payload. */
export interface IndustryDetail {
  id: string;
  name: string;
  nameZh: string | null;
  sector: string;
  description: string | null;
  /** Root → this node. Rendered as a breadcrumb; `level` never reaches the UI. */
  path: TaxonomyRef[];
  /** Direct children, so a parent offers the way down. */
  children: (TaxonomyRef & { companyCount: number })[];
  /** Members INCLUDING descendants — a parent is never falsely empty. */
  companies: CompanySummary[];
  series: MetricSeries[];
  cycleSignal: CycleSignal | null;
}

// --- Industry drivers (the causal layer) ------------------------------------

export type DriverVerdict =
  | "insufficient-data"
  | "holds"
  | "weak"
  | "contradicted";

export interface DriverBacktest {
  verdict: DriverVerdict;
  n: number;
  testedAgainst: string | null;
  isProxy: boolean;
  proxyNote: string | null;
  /** Target-unit change per +10% driver move, holding `controlledFor` fixed. */
  impliedElasticity: number | null;
  r2: number | null;
  signMatchesClaim: boolean | null;
  controlledFor: string[];
  sampleFrom: string | null;
  sampleTo: string | null;
}

/** Diagnostic only — the claimed lag is what gets a verdict. */
export interface DriverLagProbe {
  lagQuarters: number;
  impliedElasticity: number | null;
  r2: number | null;
  n: number;
}

export interface IndustryDriver {
  id: number;
  industryId: string;
  key: string;
  name: string;
  nameZh: string | null;
  whatItIs: string | null;
  phase: "leading" | "coincident" | "lagging";
  lagQuarters: number;
  affects: string | null;
  direction: number;
  elasticityLow: number | null;
  elasticityHigh: number | null;
  elasticityUnit: string | null;
  targetMetric: string | null;
  whoItHits: string | null;
  seriesKey: string | null;
  frequency: string | null;
  kind: "fact" | "assumption";
  confidence: number;
  sourceName: string | null;
  sourceUrl: string | null;
  /** The node this driver hangs off — may be a leaf below the one requested. */
  nodeId: string;
  nodeName: string;
  nodeNameZh: string | null;
  /** True when it belongs to a descendant rather than the node being viewed. */
  inherited: boolean;
  hasSeries: boolean;
  backtest: DriverBacktest;
  lagProfile: DriverLagProbe[];
}

/** GET /v1/industries/:id/drivers */
export interface IndustryDrivers {
  industryId: string;
  target: {
    metric: string;
    label: string;
    unit: string;
    points: { quarter: string; value: number }[];
    companies: string[];
  } | null;
  drivers: IndustryDriver[];
}

// --- Industry taxonomy ------------------------------------------------------

/** A node referenced from a path or a child list. */
export interface TaxonomyRef {
  id: string;
  name: string;
  nameZh: string | null;
}

export interface TaxonomyTreeNode extends TaxonomyRef {
  /** Companies at or below this node. */
  companyCount: number;
  /** Companies filed exactly here — 0 on every node that is a pure grouping. */
  directCompanyCount: number;
  children: TaxonomyTreeNode[];
}

/** GET /v1/industries/tree */
export interface TaxonomyTree {
  roots: TaxonomyTreeNode[];
}

// --- News monitoring --------------------------------------------------------

/** A company a headline was tagged to, resolved for display and linking. */
export interface NewsCompanyRef {
  id: string;
  name: string;
  ticker: string | null;
}

export interface NewsFeedItem {
  id: string;
  title: string;
  link: string;
  /** Publisher when the feed named one, else the link's host. */
  source: string;
  /** True when `source` was inferred from the URL rather than asserted. */
  sourceDerived: boolean;
  publishedAt: string | null;
  /** The ticker feed this surfaced in — provenance, never a company tag. */
  query: string | null;
  companies: NewsCompanyRef[];
  industryIds: string[];
}

/** GET /v1/news */
export interface NewsFeed {
  items: NewsFeedItem[];
  lastFetchedAt: string | null;
  /** Totals before filtering, so the page can state what it is not showing. */
  total: number;
  tagged: number;
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
