/**
 * Cross-sectional percentile ranking for the Atlas Score (P010 v2).
 *
 * v1 scores a company against DOCUMENTED ABSOLUTE THRESHOLDS, so a name scores
 * the same regardless of what else is covered. That is deliberate and stays
 * the headline number. This adds a second, RELATIVE lens on top: where does
 * this company rank against the others Atlas actually covers?
 *
 * The two answer different questions and neither replaces the other. Absolute:
 * "is a 26% net margin good?" — yes, on its own terms. Relative: "is it good
 * FOR A CHIPMAKER in this universe?" — maybe only middling. A decision usually
 * wants both.
 *
 * The honesty constraint that governs the whole thing: **a percentile here is
 * within Atlas's coverage universe, not the market.** Ranking 17 hand-picked
 * AI-infrastructure and glove names is not ranking the S&P; the peer count
 * travels with every percentile so nobody reads "90th percentile" as "top
 * decile of all equities". With a universe this small the percentile is coarse
 * by construction, and saying so is part of reporting it honestly.
 */

/**
 * Mid-rank percentile of `value` within `population`.
 *
 * Uses the mid-rank convention — ties share the average of the ranks they
 * span — so two identical scores get one percentile rather than an arbitrary
 * order deciding which looks better. Returns a 0–100 number where 100 means
 * "at least as high as every peer".
 *
 *   pct = (#below + 0.5 × #equal) / N × 100
 */
export function percentileRank(value: number, population: number[]): number | null {
  const vals = population.filter((v) => Number.isFinite(v));
  if (vals.length === 0) return null;
  let below = 0;
  let equal = 0;
  for (const v of vals) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  return Number((((below + 0.5 * equal) / vals.length) * 100).toFixed(1));
}

/** The factors a percentile is computed for, plus the composite. */
export const PERCENTILE_KEYS = [
  "composite",
  "profitability",
  "growth",
  "strength",
  "cash",
] as const;

export type PercentileKey = (typeof PERCENTILE_KEYS)[number];

/** One company's scores, as the ranking sees them. Nulls are not ranked. */
export interface ScoredEntity {
  id: string;
  composite: number | null;
  factors: Record<string, number | null>;
}

export interface PercentileResult {
  /** null where the company has no score for that key, or nobody does. */
  values: Record<PercentileKey, number | null>;
  /** How many peers each percentile was computed against — the honesty field. */
  peerCounts: Record<PercentileKey, number>;
}

/** Pull one key's value off an entity (composite is top-level, rest are factors). */
function valueOf(entity: ScoredEntity, key: PercentileKey): number | null {
  return key === "composite" ? entity.composite : entity.factors[key] ?? null;
}

/**
 * Percentile-rank every entity against the population, per key.
 *
 * A company that lacks a given score is not ranked for it (null), and — just
 * as important — is not counted in anyone else's denominator for that key: a
 * peer with no cash-quality score should not make everyone else look better
 * ranked than they are.
 */
export function computePercentiles(
  entities: ScoredEntity[],
): Map<string, PercentileResult> {
  const populations = {} as Record<PercentileKey, number[]>;
  for (const key of PERCENTILE_KEYS) {
    populations[key] = entities
      .map((e) => valueOf(e, key))
      .filter((v): v is number => v !== null && Number.isFinite(v));
  }

  const out = new Map<string, PercentileResult>();
  for (const e of entities) {
    const values = {} as Record<PercentileKey, number | null>;
    const peerCounts = {} as Record<PercentileKey, number>;
    for (const key of PERCENTILE_KEYS) {
      const v = valueOf(e, key);
      peerCounts[key] = populations[key].length;
      values[key] = v === null ? null : percentileRank(v, populations[key]);
    }
    out.set(e.id, { values, peerCounts });
  }
  return out;
}
