/**
 * Atlas Score — a systematic multi-factor score (P010 v1).
 *
 * NOT investment advice. It is a transparent, reproducible summary of a
 * company's financial profile across four factors, each built from the same
 * facts the rest of the platform uses. Every factor score carries the metrics
 * and thresholds behind it (the "evidence chain" the design calls for). No
 * price, no forecast — purely reported fundamentals.
 *
 * v1 uses documented absolute thresholds (not cross-sectional percentiles) so
 * a single company scores identically regardless of what else is in coverage;
 * percentile ranking is a v2 refinement. Missing inputs are skipped and the
 * factor / composite is reweighted over what's available — never imputed.
 */
import type { FactMap } from "./concepts";
import { deriveSeries, type DerivedPeriod } from "./ratios";

/** Piecewise-linear normaliser: `lo`→0, `hi`→100, clamped. Handles hi<lo. */
function norm(value: number | undefined, lo: number, hi: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const t = (value - lo) / (hi - lo);
  return Math.max(0, Math.min(100, t * 100));
}

interface MetricScore {
  label: string;
  value: string;
  score: number;
}

interface FactorInput {
  key: string;
  label: string;
  weight: number;
  rationale: string;
  metrics: () => (MetricScore | null)[];
}

export interface FactorScore {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  rationale: string;
  metrics: MetricScore[];
}

export interface ScoreResult {
  atlasScore: number | null;
  grade: string;
  asOf: string | null;
  factors: FactorScore[];
  note: string;
}

const fmtPct = (v: number | undefined) => (v === undefined ? "—" : `${v.toFixed(1)}%`);
const fmtX = (v: number | undefined, d = 2) => (v === undefined ? "—" : `${v.toFixed(d)}x`);

function metric(
  label: string,
  value: string,
  score: number | undefined,
): MetricScore | null {
  return score === undefined ? null : { label, value, score: Math.round(score) };
}

/** Average of the available metric scores, or null if none. */
function factorScore(metrics: (MetricScore | null)[]): number | null {
  const present = metrics.filter((m): m is MetricScore => m !== null);
  if (present.length === 0) return null;
  return present.reduce((a, m) => a + m.score, 0) / present.length;
}

function gradeOf(score: number | null): string {
  if (score === null) return "—";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "E";
}

/** Multi-year revenue CAGR (%) across the available annual periods. */
function revenueCagr(facts: FactMap[]): number | undefined {
  const revs = facts.map((f) => f.Revenue).filter((r): r is number => typeof r === "number");
  if (revs.length < 2) return undefined;
  const first = revs[0]!;
  const last = revs[revs.length - 1]!;
  if (first <= 0 || last <= 0) return undefined;
  const years = revs.length - 1;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

/**
 * Compute the score from an ordered annual fact series (oldest -> newest).
 * `periodLabel` is the latest period, surfaced as `asOf`.
 */
export function computeScore(
  factsSeries: FactMap[],
  periodLabel: string | null,
): ScoreResult {
  const note =
    "Systematic factor score from reported fundamentals. Not investment advice.";
  if (factsSeries.length === 0) {
    return { atlasScore: null, grade: "—", asOf: null, factors: [], note };
  }
  const derived: DerivedPeriod[] = deriveSeries(factsSeries);
  const d = derived[derived.length - 1]!;
  const cagr = revenueCagr(factsSeries);

  const inputs: FactorInput[] = [
    {
      key: "profitability",
      label: "Profitability",
      weight: 0.3,
      rationale: "Margins and returns on capital. Net margin 0→30%+, ROE 0→25%+.",
      metrics: () => [
        metric("Net margin", fmtPct(d.netMarginPct), norm(d.netMarginPct, 0, 30)),
        metric("Operating margin", fmtPct(d.operatingMarginPct), norm(d.operatingMarginPct, 0, 35)),
        metric("Return on equity", fmtPct(d.returnOnEquityPct), norm(d.returnOnEquityPct, 0, 25)),
      ],
    },
    {
      key: "growth",
      label: "Growth",
      weight: 0.25,
      rationale: "Latest revenue growth and multi-year CAGR. 0→40%.",
      metrics: () => [
        metric("Revenue growth (YoY)", fmtPct(d.revenueGrowthPct), norm(d.revenueGrowthPct, 0, 40)),
        metric("Revenue CAGR", fmtPct(cagr), norm(cagr, 0, 30)),
      ],
    },
    {
      key: "strength",
      label: "Financial strength",
      weight: 0.25,
      rationale: "Balance-sheet safety. Debt/equity 1.5→0, current ratio 1→3.",
      metrics: () => [
        metric("Debt / equity", fmtX(d.debtToEquity), norm(d.debtToEquity, 1.5, 0)),
        metric("Current ratio", fmtX(d.currentRatio, 1), norm(d.currentRatio, 1, 3)),
        metric("Interest coverage", fmtX(d.interestCoverage, 0), norm(d.interestCoverage, 2, 20)),
      ],
    },
    {
      key: "cash",
      label: "Cash quality",
      weight: 0.2,
      rationale: "Earnings converting to cash. FCF margin 0→25%, conversion 60→110%.",
      metrics: () => [
        metric("FCF margin", fmtPct(d.fcfMarginPct), norm(d.fcfMarginPct, 0, 25)),
        metric("Cash conversion", fmtPct(d.cashConversionPct), norm(d.cashConversionPct, 60, 110)),
      ],
    },
  ];

  const factors: FactorScore[] = inputs.map((f) => {
    const metrics = f.metrics().filter((m): m is MetricScore => m !== null);
    return {
      key: f.key,
      label: f.label,
      weight: f.weight,
      score: factorScore(metrics),
      rationale: f.rationale,
      metrics,
    };
  });

  // Composite: weight only the factors that have a score, renormalised.
  const scored = factors.filter((f) => f.score !== null);
  const totalWeight = scored.reduce((a, f) => a + f.weight, 0);
  const atlasScore =
    totalWeight === 0
      ? null
      : Math.round(
          scored.reduce((a, f) => a + (f.score as number) * f.weight, 0) / totalWeight,
        );

  return { atlasScore, grade: gradeOf(atlasScore), asOf: periodLabel, factors, note };
}
