/**
 * Presenters — assemble engine output into the exact DTO shapes the frontend
 * already defines (MetricRow, RatioGroup, SeriesPoint, ResultRow). If a shape
 * here changes, apps/web types must change with it; these are the contract.
 */
import type { FactMap } from "./concepts.ts";
import type { DerivedPeriod } from "./ratios.ts";
import { deriveSeries, direction, fmt, freeCashFlow, sparkline } from "./ratios.ts";

// --- DTOs (mirrors of apps/web contracts) ----------------------------------

export interface MetricRowDto {
  label: string;
  latest: string;
  series: number[];
}

export interface RatioDto {
  label: string;
  value: string;
  delta?: string;
  direction?: "up" | "down";
  series?: number[];
}

export interface RatioGroupDto {
  title: string;
  description: string;
  ratios: RatioDto[];
}

export interface SeriesPointDto {
  label: string;
  value: number;
}

export interface ResultRowDto {
  id: string;
  period: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
}

// --- helpers ----------------------------------------------------------------

type Pick = (d: DerivedPeriod) => number | undefined;

const last = <T>(xs: T[]): T | undefined => xs[xs.length - 1];
const prevOf = <T>(xs: T[]): T | undefined => xs[xs.length - 2];

// --- metrics page -----------------------------------------------------------

/** Key-metrics table: label + latest formatted value + full series. */
export function presentMetrics(factsSeries: FactMap[]): MetricRowDto[] {
  const derived = deriveSeries(factsSeries);
  const defs: { label: string; pick: Pick; format: (v?: number) => string }[] = [
    { label: "Gross margin", pick: (d) => d.grossMarginPct, format: fmt.pct },
    { label: "Operating margin", pick: (d) => d.operatingMarginPct, format: fmt.pct },
    { label: "Net margin", pick: (d) => d.netMarginPct, format: fmt.pct },
    { label: "Revenue growth (YoY)", pick: (d) => d.revenueGrowthPct, format: fmt.pct },
    { label: "Free cash flow margin", pick: (d) => d.fcfMarginPct, format: fmt.pct },
    { label: "Return on equity", pick: (d) => d.returnOnEquityPct, format: fmt.pct },
  ];
  const rows: MetricRowDto[] = [];
  for (const def of defs) {
    const series = sparkline(derived, def.pick);
    const latest = def.format(last(derived) ? def.pick(last(derived)!) : undefined);
    if (!series && latest === "—") continue;
    rows.push({ label: def.label, latest, series: series ?? [] });
  }
  return rows;
}

// --- ratio dashboard --------------------------------------------------------

interface RatioDef {
  label: string;
  pick: Pick;
  format: (v?: number) => string;
  delta?: (curr?: number, prev?: number) => string | undefined;
  higherIsBetter?: boolean;
  withSeries?: boolean;
}

function buildRatios(derived: DerivedPeriod[], defs: RatioDef[]): RatioDto[] {
  const curr = last(derived);
  const prev = prevOf(derived);
  const out: RatioDto[] = [];
  for (const def of defs) {
    const c = curr ? def.pick(curr) : undefined;
    if (c === undefined) continue;
    const p = prev ? def.pick(prev) : undefined;
    const dir = direction(c, p, def.higherIsBetter ?? true);
    const delta = def.delta?.(c, p);
    const series = def.withSeries ? sparkline(derived, def.pick) : undefined;
    out.push({
      label: def.label,
      value: def.format(c),
      ...(delta ? { delta } : {}),
      ...(dir ? { direction: dir } : {}),
      ...(series ? { series } : {}),
    });
  }
  return out;
}

/** The grouped ratio dashboard (P004). Groups with no computable ratios drop. */
export function presentRatioGroups(factsSeries: FactMap[]): RatioGroupDto[] {
  const derived = deriveSeries(factsSeries);
  const turns = (v?: number) => fmt.turns(v, 1);
  const turns2 = (v?: number) => fmt.turns(v, 2);

  const groups: { title: string; description: string; defs: RatioDef[] }[] = [
    {
      title: "Profitability",
      description: "How much of revenue converts to profit.",
      defs: [
        { label: "Gross margin", pick: (d) => d.grossMarginPct, format: fmt.pct, delta: fmt.deltaPts, withSeries: true },
        { label: "Operating margin", pick: (d) => d.operatingMarginPct, format: fmt.pct, delta: fmt.deltaPts, withSeries: true },
        { label: "Net margin", pick: (d) => d.netMarginPct, format: fmt.pct, delta: fmt.deltaPts, withSeries: true },
        { label: "Return on equity", pick: (d) => d.returnOnEquityPct, format: fmt.pct, delta: fmt.deltaPts, withSeries: true },
      ],
    },
    {
      title: "Liquidity",
      description: "Ability to cover short-term obligations.",
      defs: [
        { label: "Current ratio", pick: (d) => d.currentRatio, format: turns, delta: fmt.deltaTurns, withSeries: true },
        { label: "Quick ratio", pick: (d) => d.quickRatio, format: turns, withSeries: true },
        { label: "Cash ratio", pick: (d) => d.cashRatio, format: turns, withSeries: true },
      ],
    },
    {
      title: "Leverage",
      description: "Balance-sheet risk.",
      defs: [
        { label: "Debt / equity", pick: (d) => d.debtToEquity, format: turns2, higherIsBetter: false },
        { label: "Net debt / EBITDA", pick: (d) => d.netDebtToEbitda, format: turns, higherIsBetter: false },
        { label: "Interest coverage", pick: (d) => d.interestCoverage, format: (v) => fmt.turns(v, 0), delta: (c, p) => fmt.deltaTurns(c, p, 0) },
      ],
    },
    {
      title: "Efficiency",
      description: "How well assets and working capital are used.",
      defs: [
        { label: "Asset turnover", pick: (d) => d.assetTurnover, format: turns2, withSeries: true },
        { label: "Inventory turnover", pick: (d) => d.inventoryTurnover, format: turns, withSeries: true },
        { label: "Receivable days", pick: (d) => d.receivableDays, format: fmt.days, delta: fmt.deltaDays, higherIsBetter: false, withSeries: true },
      ],
    },
    {
      title: "Cash generation",
      description: "Quality of earnings as cash.",
      defs: [
        { label: "FCF margin", pick: (d) => d.fcfMarginPct, format: fmt.pct, delta: fmt.deltaPts, withSeries: true },
        { label: "Cash conversion", pick: (d) => d.cashConversionPct, format: (v) => (v === undefined ? "—" : `${Math.round(v)}%`), delta: fmt.deltaPts, withSeries: true },
      ],
    },
  ];

  return groups
    .map((g) => ({
      title: g.title,
      description: g.description,
      ratios: buildRatios(derived, g.defs),
    }))
    .filter((g) => g.ratios.length > 0);
}

// --- trends -----------------------------------------------------------------

/** Named trend series for chart pages. Missing values drop their point. */
export function presentTrends(
  labels: string[],
  factsSeries: FactMap[],
): Record<"revenue" | "netIncome" | "freeCashFlow", SeriesPointDto[]> {
  const pickSeries = (pick: (f: FactMap) => number | undefined) =>
    factsSeries
      .map((f, i) => ({ label: labels[i] ?? "", value: pick(f) }))
      .filter((p): p is SeriesPointDto => p.value !== undefined);
  return {
    revenue: pickSeries((f) => f.Revenue),
    netIncome: pickSeries((f) => f.NetIncome),
    freeCashFlow: pickSeries((f) => freeCashFlow(f)),
  };
}

// --- results tables ---------------------------------------------------------

/** Quarterly/annual results rows, newest first (as the UI lists them). */
export function presentResults(
  labels: string[],
  factsSeries: FactMap[],
): ResultRowDto[] {
  const rows = factsSeries.map((f, i) => {
    const revenue = f.Revenue;
    const grossProfit =
      revenue === undefined || f.CostOfRevenue === undefined
        ? undefined
        : revenue - f.CostOfRevenue;
    const eps =
      f.NetIncome === undefined || !f.DilutedShares
        ? undefined
        : f.NetIncome / f.DilutedShares;
    return {
      id: `p${i}`,
      period: labels[i] ?? "",
      revenue: revenue ?? null,
      grossProfit: grossProfit ?? null,
      operatingIncome: f.OperatingIncome ?? null,
      netIncome: f.NetIncome ?? null,
      eps: eps === undefined ? null : Number(eps.toFixed(2)),
    };
  });
  return rows.reverse();
}
