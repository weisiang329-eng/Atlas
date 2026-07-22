/**
 * Verifies the presentation layer.
 *
 * This is the last thing between the engines and the screen, and it is where
 * the quarterly EPS bug surfaced: `presentResults` divides NetIncome by
 * DilutedShares, so a poisoned share count became −1,534.29 on a $42.9bn
 * profit. The engine was fixed, but nothing pinned the presenter's own rules.
 *
 * What matters here is the missing-data contract. Convention #1 says a value
 * that does not exist renders "—", never a guess and never a zero — and this
 * layer is where that promise is actually kept or broken.
 */
import {
  presentMetrics,
  presentRatioGroups,
  presentResults,
  presentTrends,
} from "../src/domain/presenters.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const FY = (over = {}) => ({
  Revenue: 1000, CostOfRevenue: 400, OperatingIncome: 250, NetIncome: 200,
  TotalEquity: 1000, CurrentAssets: 600, CurrentLiabilities: 200,
  OperatingCashFlow: 300, Capex: 100, DilutedShares: 100, ...over,
});

console.log("--- results are newest-first, as the UI lists them ---");
{
  const rows = presentResults(["FY23", "FY24", "FY25"], [FY({ Revenue: 100 }), FY({ Revenue: 200 }), FY({ Revenue: 300 })]);
  check("three rows", rows.length, 3);
  check("newest first", rows.map((r) => r.period), ["FY25", "FY24", "FY23"]);
  check("values follow their label", rows.map((r) => r.revenue), [300, 200, 100]);
}

console.log("\n--- EPS: the division that produced −1,534.29 ---");
{
  const [r] = presentResults(["FY25"], [FY({ NetIncome: 200, DilutedShares: 100 })]);
  check("2.00 per share", r.eps, 2);

  // A share count of zero must not yield Infinity, and a missing one must not
  // yield a number at all.
  const [z] = presentResults(["FY25"], [FY({ DilutedShares: 0 })]);
  check("zero shares -> null, never Infinity", z.eps, null);
  const [m] = presentResults(["FY25"], [FY({ DilutedShares: undefined })]);
  check("missing shares -> null, never 0", m.eps, null);

  // A loss is a real negative EPS; only nonsense should be suppressed.
  const [l] = presentResults(["FY25"], [FY({ NetIncome: -50, DilutedShares: 100 })]);
  check("a loss gives negative EPS", l.eps, -0.5);
}

console.log("\n--- missing inputs render as null, not zero ---");
{
  const [r] = presentResults(["FY25"], [{ Revenue: 1000 }]);
  check("revenue present", r.revenue, 1000);
  check("gross profit unknown without cost of revenue", r.grossProfit, null);
  check("operating income absent -> null, not 0", r.operatingIncome, null);
  check("net income absent -> null, not 0", r.netIncome, null);
  check("nothing is NaN", Object.values(r).every((v) => typeof v !== "number" || Number.isFinite(v)), true);
}

console.log("\n--- metrics drop rows that have no data at all ---");
{
  const rows = presentMetrics([{ Revenue: 1000, NetIncome: 200 }]);
  const labels = rows.map((r) => r.label);
  check("net margin survives", labels.includes("Net margin"), true);
  check("gross margin is dropped, not shown as —", labels.includes("Gross margin"), false);
  check("no surviving row is entirely empty",
    rows.every((r) => r.latest !== "—" || r.series.length > 0), true);
  check("empty input produces no rows", presentMetrics([]), []);
}

console.log("\n--- a sparkline needs two real points ---");
{
  const one = presentMetrics([FY()]);
  check("single period -> no series", one.every((r) => r.series.length === 0), true);
  const two = presentMetrics([FY({ Revenue: 1000, NetIncome: 100 }), FY({ Revenue: 1000, NetIncome: 200 })]);
  const nm = two.find((r) => r.label === "Net margin");
  check("two periods -> a series", nm.series, [10, 20]);
  check("latest is the newest, not the first", nm.latest, "20.0%");
}

console.log("\n--- trends drop missing points rather than plotting them as zero ---");
{
  const t = presentTrends(["FY23", "FY24", "FY25"], [
    { Revenue: 100, NetIncome: 10, OperatingCashFlow: 50, Capex: 20 },
    { NetIncome: 20 },                       // no revenue this period
    { Revenue: 300, NetIncome: 30 },         // no cash-flow inputs
  ]);
  check("revenue plots only the periods it has", t.revenue.map((p) => p.label), ["FY23", "FY25"]);
  check("and never a zero for the gap", t.revenue.every((p) => p.value !== 0), true);
  check("net income has all three", t.netIncome.length, 3);
  check("FCF only where both inputs exist", t.freeCashFlow.map((p) => p.label), ["FY23"]);
  check("FCF = OCF - capex", t.freeCashFlow[0].value, 30);
}

console.log("\n--- ratio groups never emit NaN or Infinity ---");
{
  for (const facts of [[FY()], [{}], [FY({ CurrentLiabilities: 0, TotalEquity: 0 })], []]) {
    const groups = presentRatioGroups(facts);
    const bad = groups.flatMap((g) => g.ratios).filter(
      (r) => typeof r.value === "number" && !Number.isFinite(r.value),
    );
    check(`no non-finite value (${facts.length} period(s))`, bad, []);
  }
  const groups = presentRatioGroups([FY()]);
  check("groups are produced for a complete period", groups.length > 0, true);
  check("every ratio carries a label", groups.flatMap((g) => g.ratios).every((r) => Boolean(r.label)), true);
}

console.log("\n--- labels and facts stay aligned when one array is short ---");
{
  // A label list shorter than the facts must not shift values onto the wrong
  // period — it should degrade to an empty label, not a misattributed number.
  const rows = presentResults(["FY25"], [FY({ Revenue: 111 }), FY({ Revenue: 222 })]);
  check("still one row per period", rows.length, 2);
  check("no period borrows another's label", new Set(rows.map((r) => r.period)).size, 2);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
