/**
 * Verifies the Atlas Score engine (P010 v1).
 *
 * This is the platform's core intellectual asset, and until now nothing
 * stopped a threshold being edited to move a company's rank — repo convention
 * #0 was a promise, not a mechanism. These checks make it a mechanism:
 * the weights and grade cuts asserted below are the ones written in
 * docs/INVESTMENT-METHODOLOGY.md, so changing the model without changing the
 * document fails the build.
 *
 * The properties that matter most are the honest ones:
 *   - a missing input is SKIPPED and the composite reweighted, never imputed
 *   - a company's score depends only on its own facts (v1 is absolute, not
 *     cross-sectional), so a rank cannot move because coverage changed
 */
import { computeScore } from "../src/domain/scoring.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const factorOf = (r, key) => r.factors.find((f) => f.key === key);

/**
 * Facts that score 100 on every factor, so a test can knock out one input at
 * a time and attribute the whole change to it.
 *   net margin 30%, op margin 35%, ROE 25%  -> profitability 100
 *   revenue +40% YoY, CAGR 40%              -> growth 100
 *   D/E 0, current 3.0, interest cover 20x  -> strength 100
 *   FCF margin 25%, cash conversion 116%    -> cash 100
 */
const PRIOR = { Revenue: 714.2857 };
const PERFECT = {
  Revenue: 1000,
  CostOfRevenue: 400,
  OperatingIncome: 350,
  NetIncome: 300,
  TotalEquity: 1200,
  LongTermDebt: 0,
  CurrentAssets: 300,
  CurrentLiabilities: 100,
  InterestExpense: 17.5,
  OperatingCashFlow: 350,
  Capex: 100,
};

console.log("--- the documented model is the implemented model (convention #0) ---");
{
  const r = computeScore([PRIOR, PERFECT], "FY25");
  // docs/INVESTMENT-METHODOLOGY.md: Profitability 30, Growth 25, Strength 25, Cash 20.
  check("profitability weight is 30%", factorOf(r, "profitability").weight, 0.3);
  check("growth weight is 25%", factorOf(r, "growth").weight, 0.25);
  check("strength weight is 25%", factorOf(r, "strength").weight, 0.25);
  check("cash weight is 20%", factorOf(r, "cash").weight, 0.2);
  const total = r.factors.reduce((a, f) => a + f.weight, 0);
  check("weights sum to exactly 1", Math.abs(total - 1) < 1e-9, true);
  check("there are exactly four factors", r.factors.length, 4);
}

console.log("\n--- grade boundaries are the documented cuts ---");
{
  // gradeOf is internal, so drive it through the composite: a single-factor
  // company scores exactly that factor, which lets us hit each boundary.
  const atMargin = (netMarginPct) =>
    computeScore([{ Revenue: 100, NetIncome: netMarginPct }], "FY25");
  // norm(netMargin, 0, 30) -> score = margin/30*100, so margin 24 -> 80.
  check("80 -> A", atMargin(24).grade, "A");
  check("just under 80 -> B", atMargin(23.8).grade, "B");
  check("65 -> B", atMargin(19.5).grade, "B");
  check("50 -> C", atMargin(15).grade, "C");
  check("35 -> D", atMargin(10.5).grade, "D");
  check("below 35 -> E", atMargin(3).grade, "E");
  check("no facts at all -> no grade, not an E", computeScore([], null).grade, "—");
  check("no facts at all -> null score, never 0", computeScore([], null).atlasScore, null);
}

console.log("\n--- a perfect profile scores 100/A, and nothing exceeds 100 ---");
{
  const r = computeScore([PRIOR, PERFECT], "FY25");
  check("atlas score", r.atlasScore, 100);
  check("grade", r.grade, "A");
  check("asOf is carried through", r.asOf, "FY25");
  for (const f of r.factors) check(`${f.key} is 100`, Math.round(f.score), 100);

  // Twice as profitable must not score 200 — norm() clamps at the top.
  const huge = computeScore([{ Revenue: 100, NetIncome: 90 }], "FY25");
  check("a 90% net margin scores 100, not 300", huge.atlasScore, 100);
}

console.log("\n--- earnings that do not convert to cash are penalised ---");
{
  /*
   * Worth pinning down, because it is the one place where "more profit"
   * legitimately lowers the score. Doubling net income while operating cash
   * flow stands still drops cash conversion from 117% to 58% — under the 60%
   * floor — so the cash factor halves and the composite falls to 90. That is
   * the accrual red flag the factor exists to catch, not a bug.
   */
  const paper = computeScore(
    [PRIOR, { ...PERFECT, NetIncome: 600, OperatingIncome: 700 }],
    "FY25",
  );
  check("profitability still maxes out", Math.round(factorOf(paper, "profitability").score), 100);
  const conv = factorOf(paper, "cash").metrics.find((m) => m.label === "Cash conversion");
  check("but cash conversion is at the floor", conv.score, 0);
  check("so the composite falls below the all-100 case", paper.atlasScore, 90);
  check("and the cash factor is the reason", Math.round(factorOf(paper, "cash").score), 50);
}

console.log("\n--- MISSING DATA IS REWEIGHTED, NEVER IMPUTED ---");
{
  /*
   * The property that makes the score honest. A company with only an income
   * statement has no growth, strength or cash factor. Those must be dropped
   * and the composite renormalised over what remains — NOT scored as zero,
   * which would silently punish a company for our missing data rather than
   * for its own financials.
   */
  const only = computeScore([{ Revenue: 1000, NetIncome: 300 }], "FY25");
  check("profitability is scored", factorOf(only, "profitability").score !== null, true);
  check("growth is null, not 0", factorOf(only, "growth").score, null);
  check("strength is null, not 0", factorOf(only, "strength").score, null);
  check("cash is null, not 0", factorOf(only, "cash").score, null);
  check(
    "composite renormalises to the single available factor (100, not 30)",
    only.atlasScore,
    100,
  );
  check("and grades on that, not on our gaps", only.grade, "A");

  // Dropping one factor from the perfect company must not change the score,
  // because the remaining three are all 100.
  const noCash = { ...PERFECT };
  delete noCash.OperatingCashFlow;
  delete noCash.Capex;
  const r = computeScore([PRIOR, noCash], "FY25");
  check("cash factor drops out", factorOf(r, "cash").score, null);
  check("composite is still 100, not 80", r.atlasScore, 100);
}

console.log("\n--- a metric is dropped, not zeroed, when its input is missing ---");
{
  const noRoe = { ...PERFECT };
  delete noRoe.TotalEquity; // kills ROE *and* debt/equity
  const r = computeScore([PRIOR, noRoe], "FY25");
  const prof = factorOf(r, "profitability");
  check("profitability keeps its two remaining metrics", prof.metrics.length, 2);
  check("and still scores 100 on them", Math.round(prof.score), 100);
  check("no metric row is emitted for the missing input", prof.metrics.some((m) => m.label === "Return on equity"), false);
}

console.log("\n--- v1 is absolute, so a score cannot move because coverage changed ---");
{
  const a = computeScore([PRIOR, PERFECT], "FY25");
  const b = computeScore([PRIOR, PERFECT], "FY25");
  check("same facts -> identical result (pure, no cross-sectional input)",
    JSON.stringify(a) === JSON.stringify(b), true);

  // Scoring a very different company in between must not disturb it.
  computeScore([{ Revenue: 5, NetIncome: -100, TotalEquity: 1 }], "FY25");
  const c = computeScore([PRIOR, PERFECT], "FY25");
  check("unaffected by other companies being scored", c.atlasScore, a.atlasScore);
}

console.log("\n--- losses and broken balance sheets score low, not undefined ---");
{
  const r = computeScore([{ Revenue: 1000, NetIncome: -200, TotalEquity: 500, OperatingIncome: -150 }], "FY25");
  check("a loss-maker still gets a score", typeof r.atlasScore, "number");
  check("and it is at the floor, not negative", r.atlasScore, 0);
  check("grade E", r.grade, "E");
}

console.log("\n--- growth needs two periods; one period is not zero growth ---");
{
  const one = computeScore([PERFECT], "FY25");
  check("single period -> no growth factor", factorOf(one, "growth").score, null);
  const two = computeScore([PRIOR, PERFECT], "FY25");
  check("two periods -> growth is scored", Math.round(factorOf(two, "growth").score), 100);
}

console.log("\n--- debt/equity is inverted: less debt scores higher ---");
{
  const lev = (debt) =>
    factorOf(
      computeScore([{ ...PERFECT, LongTermDebt: debt }], "FY25"),
      "strength",
    ).metrics.find((m) => m.label === "Debt / equity").score;
  check("zero debt scores 100", lev(0), 100);
  check("D/E 1.5 scores 0", lev(1800), 0); // 1800 / 1200 equity = 1.5
  check("more debt scores lower than less", lev(1200) < lev(600), true);
  check("beyond the floor clamps at 0, never negative", lev(9999), 0);
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
