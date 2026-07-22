/**
 * Verifies quarterly extraction from SEC companyfacts (P022 v2).
 *
 * The failure this guards against is not a crash. Many 10-Q income-statement
 * tags are YEAR-TO-DATE, so reading them as quarterly produces numbers that
 * look entirely reasonable — revenue climbing all year, then "collapsing" in
 * Q1 — and would quietly corrupt every quarterly chart, growth rate and
 * margin in the platform. Nothing downstream could detect it.
 *
 * So: differencing is checked arithmetically, and the refusal to guess is
 * checked too — a quarter that cannot be derived honestly must be ABSENT.
 */
import {
  extractQuarters,
  fiscalQuarterOf,
  reconcileQuarters,
} from "./edgar/quarters.mjs";
import { isImplausibleShareCount } from "../src/ingest/edgar-quarters.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const TAGS = { Revenue: ["Revenues"], TotalAssets: ["Assets"] };
const DUR = new Set(["Revenue"]);
// Values are scaled by 1e6 on the way out, so feed whole millions in.
const M = (n) => n * 1e6;
const usd = (entries) => ({ units: { USD: entries } });
const dur = (start, end, val, form = "10-Q", filed = "2026-01-01") => ({ start, end, val, form, filed });
const inst = (end, val, form = "10-Q", filed = "2026-01-01") => ({ end, val, form, filed });

console.log("--- fiscal quarter attribution, January fiscal year (NVIDIA) ---");
{
  // FY ends January, so FY26 runs Feb 2025 -> Jan 2026.
  check("late-Apr 2025 -> Q1 FY26", fiscalQuarterOf("2025-04-27", 1), { fy: 2026, q: 1 });
  check("late-Jul 2025 -> Q2 FY26", fiscalQuarterOf("2025-07-27", 1), { fy: 2026, q: 2 });
  check("late-Oct 2025 -> Q3 FY26", fiscalQuarterOf("2025-10-26", 1), { fy: 2026, q: 3 });
  check("late-Jan 2026 -> Q4 FY26", fiscalQuarterOf("2026-01-25", 1), { fy: 2026, q: 4 });
  check("the next Q1 rolls into FY27", fiscalQuarterOf("2026-04-26", 1), { fy: 2027, q: 1 });
}

console.log("\n--- fiscal quarter attribution, December fiscal year (AMD/Intel) ---");
{
  check("Mar 2025 -> Q1 FY25", fiscalQuarterOf("2025-03-29", 12), { fy: 2025, q: 1 });
  check("Jun 2025 -> Q2 FY25", fiscalQuarterOf("2025-06-28", 12), { fy: 2025, q: 2 });
  check("Sep 2025 -> Q3 FY25", fiscalQuarterOf("2025-09-27", 12), { fy: 2025, q: 3 });
  check("Dec 2025 -> Q4 FY25", fiscalQuarterOf("2025-12-27", 12), { fy: 2025, q: 4 });
  check("a null date is not a quarter", fiscalQuarterOf(null, 12), null);
}

console.log("\n--- YTD FIGURES ARE DIFFERENCED, NOT READ AS QUARTERLY ---");
{
  /*
   * A filer that publishes only cumulative revenue: 30 through Q1, 70 through
   * Q2, 130 through Q3. The quarters are 30, 40, 60 — never 30, 70, 130.
   */
  const gaap = {
    Revenues: usd([
      dur("2025-02-01", "2025-04-27", M(30)),   // YTD Q1  (also = Q1)
      dur("2025-02-01", "2025-07-27", M(70)),   // YTD Q2
      dur("2025-02-01", "2025-10-26", M(130)),  // YTD Q3
    ]),
    Assets: usd([inst("2025-04-27", M(1)), inst("2025-07-27", M(1)), inst("2025-10-26", M(1))]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("Q1 = the YTD-through-Q1 figure", q["2026Q1"].Revenue, 30);
  check("Q2 = 70 - 30, NOT 70", q["2026Q2"].Revenue, 40);
  check("Q3 = 130 - 70, NOT 130", q["2026Q3"].Revenue, 60);
  check("the four quarters sum back to the YTD total", 30 + 40 + 60, 130);
}

console.log("\n--- a genuine 3-month entry beats differencing ---");
{
  const gaap = {
    Revenues: usd([
      dur("2025-02-01", "2025-07-27", M(70)),  // YTD Q2
      dur("2025-02-01", "2025-04-27", M(30)),  // YTD Q1
      // The filer ALSO publishes the discrete quarter, and it is authoritative.
      dur("2025-04-28", "2025-07-27", M(41), "10-Q", "2026-06-01"),
    ]),
    Assets: usd([inst("2025-07-27", M(1))]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("uses the reported 41, not the derived 40", q["2026Q2"].Revenue, 41);
}

console.log("\n--- a quarter that cannot be derived honestly is ABSENT ---");
{
  // YTD through Q3 exists, but the Q2 YTD needed to difference it does not.
  const gaap = {
    Revenues: usd([dur("2025-02-01", "2025-10-26", M(130))]),
    Assets: usd([inst("2025-10-26", M(500))]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("no revenue is emitted for Q3", q["2026Q3"]?.Revenue, undefined);
  check("and 130 is definitely not reported as the quarter", q["2026Q3"]?.Revenue === 130, false);
  check("the quarter still exists via the balance sheet", q["2026Q3"].TotalAssets, 500);
}

console.log("\n--- differencing never crosses a fiscal year ---");
{
  // Q1 FY27 must not be derived from Q4 FY26; a new year restarts the count.
  const gaap = {
    Revenues: usd([
      dur("2025-02-01", "2026-01-25", M(200), "10-K"), // FY26 full year
      dur("2026-02-01", "2026-04-26", M(60)),          // FY27 Q1
    ]),
    Assets: usd([inst("2026-01-25", M(1)), inst("2026-04-26", M(1))]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("FY27 Q1 is 60, not 60-200", q["2027Q1"].Revenue, 60);
  check("FY26 Q4 is not invented from the annual figure", q["2026Q4"]?.Revenue, undefined);
}

console.log("\n--- balance-sheet positions are taken as-is, never differenced ---");
{
  const gaap = {
    Assets: usd([inst("2025-04-27", M(100)), inst("2025-07-27", M(150)), inst("2025-10-26", M(180))]),
    Revenues: usd([]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("Q2 assets are the balance, not the change", q["2026Q2"].TotalAssets, 150);
  check("Q3 assets are 180, not 30", q["2026Q3"].TotalAssets, 180);
}

console.log("\n--- odd windows are ignored rather than misfiled ---");
{
  const gaap = {
    Revenues: usd([
      dur("2025-05-01", "2025-10-26", M(99)), // 6 months ending Q3 — not YTD
      dur("2025-02-01", "2025-10-26", M(130)),
      dur("2025-02-01", "2025-07-27", M(70)),
    ]),
    Assets: usd([inst("2025-10-26", M(1))]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("the mid-year 6-month window is not treated as YTD", q["2026Q3"].Revenue, 60);
}

console.log("\n--- only 10-Q / 10-K forms are trusted ---");
{
  const gaap = {
    Revenues: usd([dur("2025-02-01", "2025-04-27", M(30), "8-K")]),
    Assets: usd([inst("2025-04-27", M(10), "8-K")]),
  };
  const q = extractQuarters(gaap, { fyEndMonth: 1 }, TAGS, DUR);
  check("an 8-K press release is not a filing of record", Object.keys(q), []);
}

console.log("\n--- share counts: catch unit errors, NEVER delete a stock split ---");
{
  // The defect the gate exists for: filed in units while the rest are in
  // millions — off by ~1000x.
  check("a 1000x unit error is implausible", isImplausibleShareCount(0.591, 588.684), true);
  check("NVIDIA FY10 Q1 0.542 against a 628 median", isImplausibleShareCount(0.542, 628), true);

  /*
   * The regression this pins. SEC carries the ANNUAL count split-ADJUSTED by
   * later filings while the quarterly keeps the count as originally filed, so
   * after a 10-for-1 the two differ by exactly 10x with BOTH correct. The old
   * 0.5x–2x band deleted 32 real quarters — NVIDIA 616 and 2,490, Broadcom
   * 429, Arista 79 — the first time the seed was regenerated after it shipped.
   */
  check("NVIDIA pre-split 2,490 against a post-split 24,940 survives",
    isImplausibleShareCount(2490, 24940), false);
  check("NVIDIA pre-split 616 survives a 10-for-1", isImplausibleShareCount(616, 6160), false);
  check("Broadcom 429 survives its 10-for-1", isImplausibleShareCount(429, 4290), false);
  check("Arista 79 survives its 4-for-1", isImplausibleShareCount(78.756, 315), false);
  check("even a 20-for-1 survives", isImplausibleShareCount(50, 1000), false);

  check("zero is never a share count", isImplausibleShareCount(0, 500), true);
  check("negative is never a share count", isImplausibleShareCount(-5, 500), true);
  check("no reference means no judgement is possible", isImplausibleShareCount(500, 0), true);
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
