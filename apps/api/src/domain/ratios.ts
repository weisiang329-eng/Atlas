/**
 * Financial ratio & metric engine — the computational core of P004.
 *
 * Input: an ordered array of fact maps (oldest -> newest), one per annual
 * period. Output: derived per-period series for margins, returns, liquidity,
 * leverage, efficiency and cash generation. All computation lives here — the
 * UI renders results and never derives a number (per the P004 rule that
 * "ratios are computed server-side, not in UI").
 *
 * Conventions:
 *   - Facts hold positive magnitudes for expenses/outflows (see concepts.ts).
 *   - A ratio is `undefined` when any input is missing or the denominator is
 *     zero — never 0, never NaN. Formatters render undefined as "—".
 */
import type { FactMap } from "./concepts";

const div = (a?: number, b?: number): number | undefined =>
  a === undefined || b === undefined || b === 0 ? undefined : a / b;

const pct = (x?: number): number | undefined =>
  x === undefined ? undefined : x * 100;

/** Free cash flow = operating cash flow - capex. */
export function freeCashFlow(f: FactMap): number | undefined {
  if (f.OperatingCashFlow === undefined || f.Capex === undefined)
    return undefined;
  return f.OperatingCashFlow - f.Capex;
}

/** Total debt = long-term + short-term (missing short-term treated as 0). */
function totalDebt(f: FactMap): number | undefined {
  if (f.LongTermDebt === undefined && f.ShortTermDebt === undefined)
    return undefined;
  return (f.LongTermDebt ?? 0) + (f.ShortTermDebt ?? 0);
}

/** EBITDA approximated as operating income + D&A. */
function ebitda(f: FactMap): number | undefined {
  if (f.OperatingIncome === undefined) return undefined;
  return f.OperatingIncome + (f.DepreciationAmortization ?? 0);
}

/** All per-period derived values, as percentages or turns as noted. */
export interface DerivedPeriod {
  grossMarginPct?: number;
  operatingMarginPct?: number;
  netMarginPct?: number;
  revenueGrowthPct?: number;
  fcf?: number;
  fcfMarginPct?: number;
  returnOnEquityPct?: number;
  currentRatio?: number;
  quickRatio?: number;
  cashRatio?: number;
  debtToEquity?: number;
  netDebtToEbitda?: number;
  interestCoverage?: number;
  assetTurnover?: number;
  inventoryTurnover?: number;
  receivableDays?: number;
  cashConversionPct?: number;
  eps?: number;
}

/**
 * Derive one period's ratios. `prev` (the prior period's facts) enables
 * growth; averages intentionally use period-end balances for simplicity and
 * stability with sparse data.
 */
export function derivePeriod(f: FactMap, prev?: FactMap): DerivedPeriod {
  const revenue = f.Revenue;
  const grossProfit =
    revenue === undefined || f.CostOfRevenue === undefined
      ? undefined
      : revenue - f.CostOfRevenue;

  const fcf = freeCashFlow(f);
  const debt = totalDebt(f);
  const netDebt =
    debt === undefined || f.CashAndEquivalents === undefined
      ? undefined
      : debt - f.CashAndEquivalents;

  return {
    grossMarginPct: pct(div(grossProfit, revenue)),
    operatingMarginPct: pct(div(f.OperatingIncome, revenue)),
    netMarginPct: pct(div(f.NetIncome, revenue)),
    revenueGrowthPct:
      prev?.Revenue === undefined || revenue === undefined
        ? undefined
        : pct(div(revenue - prev.Revenue, prev.Revenue)),
    fcf,
    fcfMarginPct: pct(div(fcf, revenue)),
    returnOnEquityPct: pct(div(f.NetIncome, f.TotalEquity)),
    currentRatio: div(f.CurrentAssets, f.CurrentLiabilities),
    quickRatio:
      f.CurrentAssets === undefined || f.Inventory === undefined
        ? undefined
        : div(f.CurrentAssets - f.Inventory, f.CurrentLiabilities),
    cashRatio: div(f.CashAndEquivalents, f.CurrentLiabilities),
    debtToEquity: div(debt, f.TotalEquity),
    netDebtToEbitda: div(netDebt, ebitda(f)),
    interestCoverage: div(f.OperatingIncome, f.InterestExpense),
    assetTurnover: div(revenue, f.TotalAssets),
    inventoryTurnover: div(f.CostOfRevenue, f.Inventory),
    receivableDays:
      revenue === undefined || f.AccountsReceivable === undefined || revenue === 0
        ? undefined
        : (f.AccountsReceivable / revenue) * 365,
    cashConversionPct: pct(div(f.OperatingCashFlow, f.NetIncome)),
    eps: div(f.NetIncome, f.DilutedShares),
  };
}

/** Derive the full series (oldest -> newest), threading prior periods for growth. */
export function deriveSeries(facts: FactMap[]): DerivedPeriod[] {
  return facts.map((f, i) => derivePeriod(f, facts[i - 1]));
}

// ---------------------------------------------------------------------------
// Formatting — one place turns numbers into display strings ("64.3%", "3.1x").
// ---------------------------------------------------------------------------

export const fmt = {
  pct: (v?: number): string => (v === undefined ? "—" : `${v.toFixed(1)}%`),
  turns: (v?: number, digits = 1): string =>
    v === undefined ? "—" : `${v.toFixed(digits)}x`,
  days: (v?: number): string => (v === undefined ? "—" : `${Math.round(v)}`),
  deltaPts: (curr?: number, prev?: number): string | undefined =>
    curr === undefined || prev === undefined
      ? undefined
      : `${curr - prev >= 0 ? "+" : ""}${(curr - prev).toFixed(1)}pt`,
  deltaTurns: (curr?: number, prev?: number, digits = 1): string | undefined =>
    curr === undefined || prev === undefined
      ? undefined
      : `${curr - prev >= 0 ? "+" : ""}${(curr - prev).toFixed(digits)}x`,
  deltaDays: (curr?: number, prev?: number): string | undefined =>
    curr === undefined || prev === undefined
      ? undefined
      : `${Math.round(curr - prev) >= 0 ? "+" : ""}${Math.round(curr - prev)}`,
};

/** Direction of change; `higherIsBetter=false` flips (e.g. receivable days). */
export function direction(
  curr?: number,
  prev?: number,
  higherIsBetter = true,
): "up" | "down" | undefined {
  if (curr === undefined || prev === undefined || curr === prev) return undefined;
  const improved = curr > prev === higherIsBetter;
  return improved ? "up" : "down";
}

/** Round a series to 1dp for compact sparkline payloads; drops missing points. */
export function sparkline(
  series: DerivedPeriod[],
  pick: (d: DerivedPeriod) => number | undefined,
): number[] | undefined {
  const values = series
    .map(pick)
    .filter((v): v is number => v !== undefined)
    .map((v) => Number(v.toFixed(1)));
  return values.length >= 2 ? values : undefined;
}
