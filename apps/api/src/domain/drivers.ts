/**
 * Industry drivers, and the backtest that keeps them honest.
 *
 * A driver is not a series. It is a CLAIM about a series — "NBR latex leads
 * glove margins by about a quarter, and a +10% move costs 3–4 points of
 * margin" — and the claim is the whole value: without a phase, a lag and an
 * elasticity you are looking at a chart, and with them you can do arithmetic
 * and, more importantly, **be wrong in a checkable way**
 * (docs/INDUSTRY-INTELLIGENCE.md §2, §5).
 *
 * This module is the checking half. Every claim is regressed against the real
 * series behind it and reported with its sample size, so the UI can say "this
 * relationship held over 26 quarters" or "we have never been able to test
 * this" instead of presenting both as knowledge.
 *
 * Three rules, all of them about not overclaiming:
 *
 * 1. **Below `MIN_SAMPLE` quarters there is no result at all** — not a weak
 *    one. A slope fitted through five points is noise with a decimal point.
 * 2. **A proxy is named as a proxy.** The glove claim is about GROSS margin;
 *    Bursa quarterlies carry only revenue and net income, so the test runs on
 *    net margin and says so. Silently swapping the target metric would answer
 *    a different question and call it the same one.
 * 3. **A contradicted claim is reported, not buried.** The design says a
 *    driver whose stated relationship never held is a driver to REMOVE. That
 *    only works if the verdict is visible.
 */

/** Quarters below which nothing is reported. Five points fit any story. */
export const MIN_SAMPLE = 8;

/** Above this the fit is worth calling a relationship rather than a hint. */
const R2_MEANINGFUL = 0.1;

export type DriverPhase = "leading" | "coincident" | "lagging";

/** The stored claim (mirrors `industry_driver`). */
export interface DriverClaim {
  id: number;
  industryId: string;
  key: string;
  name: string;
  nameZh: string | null;
  whatItIs: string | null;
  phase: DriverPhase;
  /** How far ahead the driver is expected to move. 0 for coincident. */
  lagQuarters: number;
  affects: string | null;
  /** Expected sign of the target's response: +1 or -1. */
  direction: number;
  /** Claimed response band, in target units per +10% driver move. */
  elasticityLow: number | null;
  elasticityHigh: number | null;
  elasticityUnit: string | null;
  /** What the claim is about, e.g. `gross_margin_pct`. */
  targetMetric: string | null;
  whoItHits: string | null;
  /** `industry_metric.metric_key` holding the driver's history. */
  seriesKey: string | null;
  frequency: string | null;
  /** `fact` once a backtest supports it; `assumption` until then. */
  kind: string;
  confidence: number;
  sourceName: string | null;
  sourceUrl: string | null;
}

export type Verdict =
  | "insufficient-data"
  | "holds"
  | "weak"
  | "contradicted";

export interface BacktestResult {
  verdict: Verdict;
  /** Paired observations actually used. */
  n: number;
  /** The metric the test ran on — not always the metric claimed. */
  testedAgainst: string | null;
  isProxy: boolean;
  proxyNote: string | null;
  /** Target-unit change per +10% driver move, over the claimed lag. */
  impliedElasticity: number | null;
  /** Model-level fit. Shared by every driver in the joint regression. */
  r2: number | null;
  signMatchesClaim: boolean | null;
  /** The other drivers held fixed — part of what the coefficient means. */
  controlledFor: string[];
  sampleFrom: string | null;
  sampleTo: string | null;
}

export interface Observation {
  /** Calendar quarter key, e.g. "2024Q3". */
  quarter: string;
  value: number;
}

/** Calendar quarter of an ISO date — the join key across fiscal calendars. */
export function quarterOf(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

/** Shift a quarter key by n quarters. */
export function shiftQuarter(quarter: string, n: number): string {
  const m = /^(\d{4})Q([1-4])$/.exec(quarter);
  if (!m) return quarter;
  const total = Number(m[1]) * 4 + (Number(m[2]) - 1) + n;
  return `${Math.floor(total / 4)}Q${(total % 4) + 1}`;
}

/**
 * Collapse dated points to one value per calendar quarter (mean).
 *
 * Sources publish on their own cadence — latex weekly, ASP monthly, filings
 * quarterly — and the claim is quarterly, so everything is brought to the
 * claim's resolution rather than the other way round.
 */
export function toQuarterly(
  points: { date: string; value: number }[],
): Observation[] {
  const buckets = new Map<string, number[]>();
  for (const p of points) {
    const q = quarterOf(p.date);
    if (!q) continue;
    const list = buckets.get(q) ?? [];
    list.push(p.value);
    buckets.set(q, list);
  }
  return [...buckets.entries()]
    .map(([quarter, values]) => ({
      quarter,
      value: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));
}

/**
 * Ordinary least squares with an intercept and any number of regressors.
 *
 * Multiple rather than simple regression for a reason discovered the hard way:
 * the first version tested one driver at a time, and on real glove data it
 * reported that **rising latex cost RAISES margin** — a coefficient of +4.3
 * points per +10%, with a straight face. The relationship is real in the data
 * and completely spurious as causation: the sample is dominated by the 2020–21
 * pandemic spike, when ASP rose far faster than feedstock, so a single-driver
 * fit attributes the boom's margin to whatever else was rising at the time.
 *
 * That is the classic omitted-variable trap, and it is exactly what a driver
 * panel must not do — it would have printed "your latex claim is
 * CONTRADICTED" and been wrong. Estimating the drivers jointly gives each its
 * PARTIAL effect: what latex does with ASP held fixed.
 *
 * Solved by Gauss-Jordan on the normal equations. k is 1–5 here, so
 * numerical sophistication would be ceremony; a singular system (a driver
 * that never moved, or two that move identically) returns null rather than a
 * fabricated coefficient.
 */
function olsMulti(
  xs: number[][],
  ys: number[],
): { coefficients: number[]; r2: number } | null {
  const n = ys.length;
  const k = xs.length;
  if (n < k + 2) return null;

  // Design matrix with an intercept column.
  const cols = [Array.from({ length: n }, () => 1), ...xs];
  const p = cols.length;

  // Normal equations: (X'X) b = X'y, augmented for Gauss-Jordan.
  const m: number[][] = [];
  for (let i = 0; i < p; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < p; j += 1) {
      let s = 0;
      for (let t = 0; t < n; t += 1) s += cols[i]![t]! * cols[j]![t]!;
      row.push(s);
    }
    let sy = 0;
    for (let t = 0; t < n; t += 1) sy += cols[i]![t]! * ys[t]!;
    row.push(sy);
    m.push(row);
  }

  for (let col = 0; col < p; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < p; r += 1) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    }
    // Singular: no unique answer exists, so there is no honest number to give.
    if (Math.abs(m[pivot]![col]!) < 1e-10) return null;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];

    const d = m[col]![col]!;
    for (let j = col; j <= p; j += 1) m[col]![j]! /= d;
    for (let r = 0; r < p; r += 1) {
      if (r === col) continue;
      const factor = m[r]![col]!;
      if (factor === 0) continue;
      for (let j = col; j <= p; j += 1) m[r]![j]! -= factor * m[col]![j]!;
    }
  }

  const beta = m.map((row) => row[p]!);

  const my = ys.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let t = 0; t < n; t += 1) {
    let fit = beta[0]!;
    for (let i = 0; i < k; i += 1) fit += beta[i + 1]! * xs[i]![t]!;
    ssRes += (ys[t]! - fit) ** 2;
    ssTot += (ys[t]! - my) ** 2;
  }
  if (ssTot === 0) return null; // a target that never moved explains nothing

  return { coefficients: beta.slice(1), r2: 1 - ssRes / ssTot };
}

export interface DriverSeriesInput {
  key: string;
  observations: Observation[];
  lagQuarters: number;
  /** Expected sign of the response: +1 or -1. */
  direction: number;
}

export interface BacktestInput {
  /** Every driver with a series. They are estimated TOGETHER — see olsMulti. */
  drivers: DriverSeriesInput[];
  /** The target series, in its own units (e.g. margin in percentage points). */
  target: Observation[];
  targetMetric: string;
  /** True when `target` is not the metric the claims name. */
  isProxy?: boolean;
  proxyNote?: string | null;
}

/** % change from the previous quarter, keyed by quarter. */
function pctChanges(obs: Observation[]): Map<string, number> {
  const byQ = new Map(obs.map((o) => [o.quarter, o.value]));
  const out = new Map<string, number>();
  for (const o of obs) {
    const prev = byQ.get(shiftQuarter(o.quarter, -1));
    if (prev === undefined || prev === 0) continue;
    out.set(o.quarter, ((o.value - prev) / Math.abs(prev)) * 100);
  }
  return out;
}

/**
 * Test every claim about an industry at once: does a % move in each driver
 * move the target, in the stated direction, its own `lagQuarters` later?
 *
 * The regression is on CHANGES, not levels. Two series that both trend
 * correlate at 0.9 in levels while saying nothing about cause — the classic
 * way to build a driver panel that looks authoritative and is worthless.
 * Changes ask the question that matters: when this moved, did that move?
 *
 * Drivers enter one joint model, each at its own lag, so every coefficient is
 * a PARTIAL effect — latex with ASP held fixed. Testing them one at a time
 * inverted the latex sign on real data (see olsMulti).
 */
export function backtestDrivers(
  input: BacktestInput,
): Map<string, BacktestResult> {
  const results = new Map<string, BacktestResult>();
  const blank = (n: number): BacktestResult => ({
    verdict: "insufficient-data",
    n,
    testedAgainst: null,
    isProxy: Boolean(input.isProxy),
    proxyNote: input.proxyNote ?? null,
    impliedElasticity: null,
    r2: null,
    signMatchesClaim: null,
    controlledFor: [],
    sampleFrom: null,
    sampleTo: null,
  });

  const usable = input.drivers.filter((d) => d.observations.length > 1);
  if (usable.length === 0) {
    for (const d of input.drivers) results.set(d.key, blank(0));
    return results;
  }

  const changes = usable.map((d) => pctChanges(d.observations));
  const targetByQ = new Map(input.target.map((o) => [o.quarter, o.value]));

  // Rows are anchored on the RESPONSE quarter, so drivers with different lags
  // line up on the same observation.
  const responseQuarters = [...targetByQ.keys()].sort();
  const xs: number[][] = usable.map(() => []);
  const ys: number[] = [];
  const kept: string[] = [];

  for (const rq of responseQuarters) {
    const resp = targetByQ.get(rq);
    const respPrev = targetByQ.get(shiftQuarter(rq, -1));
    if (resp === undefined || respPrev === undefined) continue;

    const row = usable.map((d, i) =>
      changes[i]!.get(shiftQuarter(rq, -d.lagQuarters)),
    );
    // Listwise deletion: a row missing any driver would silently change which
    // model each remaining coefficient came from.
    if (row.some((v) => v === undefined)) continue;

    row.forEach((v, i) => xs[i]!.push(v!));
    ys.push(resp - respPrev);
    kept.push(rq);
  }

  const n = ys.length;
  const fit = n >= MIN_SAMPLE + usable.length ? olsMulti(xs, ys) : null;

  usable.forEach((d, i) => {
    if (!fit) {
      results.set(d.key, blank(n));
      return;
    }
    const impliedElasticity = Number((fit.coefficients[i]! * 10).toFixed(2));
    const signMatchesClaim =
      impliedElasticity === 0
        ? false
        : Math.sign(impliedElasticity) === Math.sign(d.direction);

    results.set(d.key, {
      verdict: !signMatchesClaim
        ? "contradicted"
        : fit.r2 < R2_MEANINGFUL
          ? "weak"
          : "holds",
      n,
      testedAgainst: input.targetMetric,
      isProxy: Boolean(input.isProxy),
      proxyNote: input.proxyNote ?? null,
      impliedElasticity,
      r2: Number(fit.r2.toFixed(3)),
      signMatchesClaim,
      // Naming the controls is part of the claim: "latex, holding ASP fixed"
      // is a different statement from "latex".
      controlledFor: usable.filter((o) => o.key !== d.key).map((o) => o.key),
      sampleFrom: kept[0] ?? null,
      sampleTo: kept[kept.length - 1] ?? null,
    });
  });

  // Drivers with no series at all still get a row: "never tested" is a state
  // the page must show, because it names the missing feed.
  for (const d of input.drivers) {
    if (!results.has(d.key)) results.set(d.key, blank(0));
  }
  return results;
}

export interface LagProbe {
  lagQuarters: number;
  impliedElasticity: number | null;
  r2: number | null;
  n: number;
}

/** How far ahead a driver is allowed to be probed. Four quarters is a year. */
export const MAX_LAG_SCAN = 4;

/**
 * Coefficient for one driver at each candidate lag, holding the others at
 * their stated lags. **Diagnostic, never a verdict.**
 *
 * The distinction matters and the code cannot enforce it, so it is stated
 * here: picking the best-fitting lag out of five and reporting it as the
 * answer is fitting noise, and with 14–26 observations the noise wins. What
 * this is FOR is spotting instability — if a claim's sign flips between lag 1
 * and lag 2, the honest reading is "we cannot resolve the lag from this
 * sample", not "the lag is 2".
 *
 * It also settles a disagreement in the design doc with evidence: §2 gives NBR
 * latex a one-quarter lead, §3 files it as coincident. The profile shows what
 * the data supports for each.
 */
export function scanLags(
  input: BacktestInput,
  key: string,
  maxLag = MAX_LAG_SCAN,
): LagProbe[] {
  const out: LagProbe[] = [];
  for (let lag = 0; lag <= maxLag; lag += 1) {
    const result = backtestDrivers({
      ...input,
      drivers: input.drivers.map((d) =>
        d.key === key ? { ...d, lagQuarters: lag } : d,
      ),
    }).get(key);
    out.push({
      lagQuarters: lag,
      impliedElasticity: result?.impliedElasticity ?? null,
      r2: result?.r2 ?? null,
      n: result?.n ?? 0,
    });
  }
  return out;
}

/**
 * Industry net margin per calendar quarter, revenue-weighted.
 *
 * Weighted rather than averaged because the claim is about the INDUSTRY: an
 * unweighted mean lets the smallest maker move the sector's margin as much as
 * the largest, which is not what "glove margins fell" means.
 *
 * Net margin is used because that is what exists — the Bursa quarterlies carry
 * revenue and net income only. Callers must pass `isProxy` on to the backtest
 * when the claim is about gross margin.
 */
export function industryNetMargin(
  periods: {
    reportDate: string | null;
    facts: Record<string, number | undefined>;
  }[],
): Observation[] {
  const byQuarter = new Map<string, { revenue: number; net: number }>();

  for (const p of periods) {
    if (!p.reportDate) continue;
    const revenue = p.facts.Revenue;
    const net = p.facts.NetIncome;
    if (revenue === undefined || net === undefined || revenue <= 0) continue;

    const q = quarterOf(p.reportDate);
    if (!q) continue;
    const acc = byQuarter.get(q) ?? { revenue: 0, net: 0 };
    acc.revenue += revenue;
    acc.net += net;
    byQuarter.set(q, acc);
  }

  return [...byQuarter.entries()]
    .filter(([, v]) => v.revenue > 0)
    .map(([quarter, v]) => ({
      quarter,
      value: Number(((v.net / v.revenue) * 100).toFixed(3)),
    }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));
}
