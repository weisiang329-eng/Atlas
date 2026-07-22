/**
 * Quarterly extraction from SEC companyfacts (P022 v2).
 *
 * Annual attribution is easy: one filing, one number. Quarterly is not, for
 * one reason — **many income-statement and cash-flow tags in a 10-Q are
 * year-to-date, not the quarter**. A filer reporting 9-month revenue of 91,166
 * is not saying Q3 was 91,166. Reading YTD figures as quarterly is the single
 * most dangerous bug available here, because the numbers look completely
 * plausible: they rise smoothly all year and then collapse in Q1.
 *
 * So duration concepts are handled as:
 *   1. prefer a genuine ~90-day entry ending on that quarter (most large
 *      filers publish one alongside the YTD figure);
 *   2. otherwise derive it by differencing — Qn = YTD(n) − YTD(n−1) — which
 *      requires the immediately preceding YTD figure of the SAME fiscal year;
 *   3. otherwise emit nothing. A quarter we cannot derive honestly is absent,
 *      never estimated (convention #1).
 *
 * Q4 never appears in a 10-Q. It is derived from the 10-K: FY − 9-month YTD.
 *
 * Instant concepts (balance-sheet positions) need none of this — a balance is
 * a balance on the day it is struck, so the quarter-end value is taken as-is.
 */

/** One SEC companyfacts datapoint. */
export interface FactEntry {
  start?: string;
  end?: string;
  val: number;
  form?: string;
  filed?: string;
}
export interface TagUnits {
  USD?: FactEntry[];
  shares?: FactEntry[];
}
/** `us-gaap` block of a companyfacts response: tag -> { units }. */
export type GaapFacts = Record<string, { units?: TagUnits } | undefined>;
export interface EdgarCompany {
  id: string;
  cik: number;
  fyEndMonth: number;
}
/** "2026Q3" -> { Revenue: 57006, ... } in millions. */
export type QuarterFacts = Record<string, Record<string, number>>;

const DAY = 86_400_000;
const days = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / DAY;

/**
 * Which fiscal quarter does a period ending on `endIso` belong to?
 *
 * Quarter ends drift a few days (NVIDIA's Q3 ends in late October), so the
 * end month is allowed to sit ±1 month from the exact boundary; whichever
 * shift lands on a real quarter boundary wins.
 *
 * Returns `{ fy, q }` using the same FY convention as the annual path — the
 * label year is the calendar year in which the fiscal year ENDS.
 */
export function fiscalQuarterOf(
  endIso: string | null | undefined,
  fyEndMonth: number,
): { fy: number; q: number } | null {
  if (!endIso) return null;
  const end = new Date(endIso);
  const month = end.getUTCMonth() + 1;
  const year = end.getUTCFullYear();

  for (const shift of [0, 1, -1]) {
    const m = (((fyEndMonth - (month + shift)) % 12) + 12) % 12;
    if (m % 3 !== 0) continue;
    const q = 4 - m / 3;
    if (q < 1 || q > 4) continue;
    // The fiscal year ends `m` months after this period end.
    const fy = year + (month + shift + m > 12 ? 1 : 0);
    return { fy, q };
  }
  return null;
}

/** Number of quarters a duration entry spans: 1, 2, 3 or 4 — else null. */
function spanQuartersOf(entry: FactEntry): number | null {
  if (!entry.start || !entry.end) return null;
  const d = days(entry.start, entry.end);
  if (d >= 80 && d <= 100) return 1;
  if (d >= 170 && d <= 195) return 2;
  if (d >= 260 && d <= 285) return 3;
  if (d >= 350 && d <= 380) return 4;
  return null;
}

/** Latest-filed wins; tie-break on the later end date. */
function better(a: FactEntry | undefined, b: FactEntry): FactEntry {
  if (!a) return b;
  if (a.filed !== b.filed) return (a.filed ?? "") > (b.filed ?? "") ? a : b;
  return (a.end ?? "") >= (b.end ?? "") ? a : b;
}

const key = (fy: number, q: number) => `${fy}Q${q}`;

/**
 * Extract one tag into `{ "2026Q3": value }`.
 *
 * `isDuration` selects the flow path (differencing) or the position path
 * (take as-is). Values are returned in raw units; the caller scales.
 */
function extractTagQuarterly(
  units: TagUnits | undefined,
  fyEndMonth: number,
  isDuration: boolean,
  additive = true,
): Record<string, number> {
  const series = units?.USD ?? units?.shares ?? null;
  if (!series) return {};

  if (!isDuration) {
    // Balance-sheet position: an instant, valid on its own.
    const out: Record<string, FactEntry> = {};
    for (const e of series) {
      if (e.form !== "10-Q" && e.form !== "10-K") continue;
      const fq = fiscalQuarterOf(e.end, fyEndMonth);
      if (!fq) continue;
      const k = key(fq.fy, fq.q);
      out[k] = better(out[k], e);
    }
    return Object.fromEntries(Object.entries(out).map(([k, e]) => [k, e.val]));
  }

  // Flow: bucket by (fiscal quarter it ENDS in, how many quarters it spans).
  const direct: Record<string, FactEntry> = {}; // "2026Q3" -> best 1-quarter entry
  const ytd: Record<string, FactEntry> = {}; // "2026Q3" -> best cumulative entry ending there
  for (const e of series) {
    if (e.form !== "10-Q" && e.form !== "10-K") continue;
    const n = spanQuartersOf(e);
    if (n === null) continue;
    const fq = fiscalQuarterOf(e.end, fyEndMonth);
    if (!fq) continue;
    const k = key(fq.fy, fq.q);
    // A span of n quarters ending at Qx is year-to-date only if it starts at
    // Q1 — i.e. n === x. Anything else (a 2-quarter span ending at Q4, say)
    // is a partial window we cannot place, so it is ignored.
    if (n === 1) {
      direct[k] = better(direct[k], e);
      // Q1 is the one quarter that is also its own year-to-date, so it has to
      // be registered as both — otherwise Q2 has no cumulative baseline to
      // difference against and silently goes missing.
      if (fq.q === 1) ytd[k] = better(ytd[k], e);
    } else if (n === fq.q) ytd[k] = better(ytd[k], e);
  }

  const out: Record<string, number> = {};
  for (const [k, e] of Object.entries(direct)) out[k] = e.val;

  // A non-additive figure (a weighted-average share count) is only ever the
  // one the filer reported for that quarter. Deriving it is meaningless.
  if (!additive) return out;

  // Fill the gaps by differencing consecutive YTD figures.
  for (const [k, e] of Object.entries(ytd)) {
    if (out[k] !== undefined) continue;
    const [fyStr, qStr] = k.split("Q");
    const q = Number(qStr);
    if (q === 1) {
      // A "YTD" through Q1 IS the quarter.
      out[k] = e.val;
      continue;
    }
    const fy = Number(fyStr);
    const prev = ytd[key(fy, q - 1)];
    if (prev) {
      out[k] = e.val - prev.val;
      continue;
    }
    /*
     * No prior YTD filing, but if every earlier quarter of THIS fiscal year is
     * already known, their sum is the same baseline. Reconstructing it costs
     * nothing and recovers Q4 for filers who publish discrete quarters plus an
     * annual total. Strictly same-year — see the fiscal-year-boundary test.
     */
    const earlier: (number | undefined)[] = [];
    for (let i = 1; i < q; i++) earlier.push(out[key(fy, i)]);
    if (earlier.every((v) => v !== undefined)) {
      out[k] = e.val - (earlier as number[]).reduce((a, b) => a + b, 0);
    }
    // Otherwise the quarter stays absent rather than guessed.
  }
  return out;
}

/**
 * Build `{ "2026Q3": { Revenue: 57006, ... } }` for one company.
 * Mirrors the annual extractor's tag-priority rule: the first tag that
 * produces a value for a quarter wins; later tags only fill gaps.
 */
export function extractQuarters(
  gaap: GaapFacts,
  company: EdgarCompany,
  tagMap: Record<string, string[]>,
  durationConcepts: Set<string>,
  nonAdditiveConcepts: Set<string> = new Set(),
): QuarterFacts {
  const perQuarter: QuarterFacts = {};
  const put = (k: string, concept: string, val: number) => {
    (perQuarter[k] ??= {})[concept] = Number((val / 1e6).toFixed(3));
  };

  for (const [concept, tags] of Object.entries(tagMap)) {
    const isDuration = durationConcepts.has(concept);
    for (const tag of tags) {
      const byQ = extractTagQuarterly(
        gaap[tag]?.units,
        company.fyEndMonth,
        isDuration,
        !nonAdditiveConcepts.has(concept),
      );
      for (const [k, val] of Object.entries(byQ)) {
        if (perQuarter[k]?.[concept] === undefined) put(k, concept, val);
      }
    }
  }

  // Same sanity rule as the annual path: a quarter with neither revenue nor
  // total assets is a stub, not a quarter.
  for (const k of Object.keys(perQuarter)) {
    const p = perQuarter[k]!;
    if (p.Revenue === undefined && p.TotalAssets === undefined) delete perQuarter[k];
  }
  return perQuarter;
}

/**
 * Reconcile quarters against the annual figure and drop the years that fail.
 *
 * A complete set of four quarters must add up to the fiscal year. When it does
 * not, one of the two is wrong and we cannot tell which — so the quarters go,
 * because the annual figure comes from a single audited 10-K while the
 * quarters are stitched from four filings.
 *
 * This is not hypothetical. Vertiv's pre-2019 "quarters" resolved to revenue
 * of 0 against a $4.3bn year: those filings are the SPAC shell that later
 * acquired the business (total assets $0.025m), so the figures are true of the
 * shell and completely false as "Vertiv's quarterly revenue".
 *
 * The tolerance is deliberately loose. Restatements move a prior year by a
 * point or two — AMD's FY2016 quarters sum 1.1% under its later-restated
 * annual — and discarding real quarters over that would cost more than it
 * saves. What this catches is the order-of-magnitude wrong, not the imprecise.
 */
/**
 * Is a filed diluted-share count a UNIT ERROR rather than a real change?
 *
 * The only defect this is for: a value filed in units while its neighbours are
 * in millions — off by roughly 1000x. NVIDIA's FY11 Q1 came back as 0.591
 * against a full-year 588.684, which rendered EPS of ±200–370.
 *
 * **The band must stay wide enough for stock splits.** At 0.2x–5x this check
 * deleted 32 CORRECT quarters the first time the seed was regenerated after it
 * shipped — NVIDIA's 616 and 2,490 against a post-10-for-1 median, Broadcom's
 * 429 against its own 10-for-1, Arista's 79 against its 4-for-1. A split moves
 * the count by 4x–10x and a whole-history median sits on one side of it, so a
 * tight band cannot tell a split from an error; it just deletes whichever side
 * of the company's history is shorter. A gate that removes real data to be
 * safe is not being safe.
 *
 * 100x leaves every split intact and still catches a 1000x unit error.
 */
export function isImplausibleShareCount(
  value: number,
  reference: number,
): boolean {
  if (!(value > 0) || !(reference > 0)) return true;
  const ratio = value / reference;
  return ratio < 0.01 || ratio > 100;
}

export function reconcileQuarters(
  years: Record<string, Record<string, number>>,
  quarters: QuarterFacts,
  tolerance = 0.05,
): { quarters: QuarterFacts; dropped: { fy: number; annual: number; sum: number }[] } {
  const dropped: { fy: number; annual: number; sum: number }[] = [];
  const out: QuarterFacts = {};
  for (const [k, v] of Object.entries(quarters)) out[k] = { ...v };

  /*
   * Pass 0 note — see `isImplausibleShareCount` for why the share-count bands
   * below are as wide as they are. A tighter gate deleted 32 correct quarters.
   */

  /*
   * Pass 1 — zero revenue is not a slow quarter, it is the wrong entity.
   * Vertiv's 2017-18 filings are the SPAC shell that later bought the
   * business (total assets $0.025m). Runs over every quarter independently,
   * because the years these appear in are usually incomplete and would never
   * reach the whole-year check below.
   */
  for (const k of Object.keys(out)) {
    if (out[k]!.Revenue === 0) delete out[k]!.Revenue;
    if (Object.keys(out[k]!).length === 0) delete out[k];
  }

  /*
   * Pass 2 — a quarterly share count must be plausible against its own year.
   *
   * NVIDIA's FY11 Q1/Q2 come back as 0.591 and 0.573 million shares against a
   * full-year weighted average of 588.684 million: a 1000x unit error in the
   * filed data itself, which rendered EPS of +232.82 and −246.01. A weighted
   * average cannot drift far inside one year — buybacks and issuance move it
   * by percentage points, not multiples — so anything outside 0.5x–2x of the
   * annual figure is the wrong unit, not a real change.
   */
  for (const fyStr of Object.keys(years)) {
    const fy = Number(fyStr);
    const annualShares = years[fyStr]?.DilutedShares;
    if (annualShares === undefined || annualShares <= 0) continue;
    for (let q = 1; q <= 4; q++) {
      const k = key(fy, q);
      const v = out[k]?.DilutedShares;
      if (v === undefined) continue;
      // Same band as pass 3, and for a sharper reason: SEC's companyfacts
      // carries the ANNUAL figure split-ADJUSTED by later filings while the
      // quarterly figure keeps the count as originally filed. After NVIDIA's
      // 10-for-1 the two differ by exactly 10x with both numbers correct, so a
      // 0.5x–2x band deleted every pre-split quarter it touched.
      if (isImplausibleShareCount(v, annualShares)) {
        delete out[k]!.DilutedShares;
        if (Object.keys(out[k]!).length === 0) delete out[k];
      }
    }
  }

  /*
   * Pass 3 — the same plausibility check, but self-contained.
   *
   * Pass 2 needs an annual share count to compare against, and older fiscal
   * years often have none, which let NVIDIA's FY10/FY11 unit errors through.
   * A company's diluted share count is one of the most stable series it
   * reports, so the median of its own quarters is a yardstick a 1000x error
   * cannot hide from.
   *
   * THE BAND IS DELIBERATELY WIDE, and it was not always. At 0.2x–5x this
   * gate deleted 32 CORRECT quarters the first time the seed was regenerated
   * after it shipped: NVIDIA's pre-split 616 and 2,490 against a
   * post-10-for-1 median, Broadcom's 429 against its own 10-for-1, Arista's
   * 79 against its 4-for-1. **A stock split legitimately moves the share
   * count by 4x–10x**, and a whole-history median sits on one side of it, so
   * a tight band cannot tell a split from an error — it just deletes whichever
   * side of the company's history is shorter.
   *
   * The defect this exists to catch is a UNIT error: filed in units where the
   * rest are in millions, i.e. off by ~1000x. So the band only has to exclude
   * that, and 0.01x–100x does, while leaving every split intact. A gate that
   * removes real history to be safe is not being safe.
   */
  {
    const counts = Object.values(out)
      .map((q) => q.DilutedShares)
      .filter((v): v is number => typeof v === "number" && v > 0)
      .sort((a, b) => a - b);
    if (counts.length >= 4) {
      const median = counts[Math.floor(counts.length / 2)]!;
      for (const k of Object.keys(out)) {
        const v = out[k]!.DilutedShares;
        if (v === undefined) continue;
        if (isImplausibleShareCount(v, median)) {
          delete out[k]!.DilutedShares;
          if (Object.keys(out[k]!).length === 0) delete out[k];
        }
      }
    }
  }

  // Pass 4 — a complete set of four quarters must add up to the fiscal year.
  for (const fyStr of Object.keys(years)) {
    const fy = Number(fyStr);
    const annual = years[fyStr]?.Revenue;
    if (annual === undefined || annual === 0) continue;

    const keys = [1, 2, 3, 4].map((q) => key(fy, q));
    const vals = keys.map((k) => out[k]?.Revenue);
    if (vals.some((v) => v === undefined)) continue; // incomplete: nothing to check

    const sum = (vals as number[]).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - annual) / Math.abs(annual) <= tolerance) continue;

    dropped.push({ fy, annual, sum });
    for (const k of keys) delete out[k];
  }
  return { quarters: out, dropped };
}

export function extractAnnualRevenue(
  gaap: GaapFacts,
  company: EdgarCompany,
  tagMap: Record<string, string[]>,
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const tag of [...(tagMap.Revenue ?? []), ...(tagMap.DilutedShares ?? [])]) {
    const isShares = (tagMap.DilutedShares ?? []).includes(tag);
    const series = gaap[tag]?.units?.USD ?? gaap[tag]?.units?.shares;
    if (!series) continue;
    for (const e of series) {
      if (e.form !== "10-K") continue;
      if (spanQuartersOf(e) !== 4) continue;
      const fq = fiscalQuarterOf(e.end, company.fyEndMonth);
      if (!fq || fq.q !== 4) continue;
      const fy = String(fq.fy);
      // First tag wins, matching the extraction path's priority rule.
      const field = isShares ? "DilutedShares" : "Revenue";
      if (out[fy]?.[field] === undefined) {
        (out[fy] ??= {})[field] = Number((e.val / 1e6).toFixed(3));
      }
    }
  }
  return out;
}
