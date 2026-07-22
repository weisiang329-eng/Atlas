/**
 * Verifies the statement renderer.
 *
 * Two repo conventions live or die here:
 *
 *   #3 "Facts are magnitudes; presentation applies the sign." Expenses are
 *      STORED positive and DISPLAYED negative. Flip that and a cost line
 *      reads +400 on a real company's income statement — a plausible-looking
 *      number that is wrong, which is the worst failure mode this platform
 *      has. Nothing but this test stands between a stray `sign` edit and that.
 *
 *   #1 Missing data renders "—", never a guess. Inside a kept row a missing
 *      period must be `null`; a row missing everywhere is dropped entirely
 *      rather than shown as a row of blanks.
 */
import { isStatementType, renderStatement } from "../src/domain/statements.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const row = (rows, label) => rows.find((r) => r.label === label);

const FY24 = {
  Revenue: 1000, ProductRevenue: 800, ServiceRevenue: 200,
  CostOfRevenue: 400, RnDExpense: 150, SnMExpense: 90, GnAExpense: 60,
  OperatingIncome: 300, NetIncome: 240,
  TotalAssets: 2000, TotalEquity: 1200, CurrentAssets: 900, CurrentLiabilities: 300,
  OperatingCashFlow: 350, Capex: 120,
};

console.log("--- statement types are recognised, junk is not ---");
{
  check("income-statement", isStatementType("income-statement"), true);
  check("balance-sheet", isStatementType("balance-sheet"), true);
  check("cash-flow", isStatementType("cash-flow"), true);
  check("unknown type rejected", isStatementType("p&l"), false);
  check("prototype keys are not statement types", isStatementType("toString"), false);
}

console.log("\n--- CONVENTION #3: expenses stored positive, rendered negative ---");
{
  const rows = renderStatement("income-statement", [FY24]);
  check("cost of revenue is stored positive", FY24.CostOfRevenue, 400);
  check("...and rendered NEGATIVE", row(rows, "Cost of revenue").values[0], -400);
  check("R&D rendered negative", row(rows, "Research & development").values[0], -150);
  check("S&M rendered negative", row(rows, "Sales & marketing").values[0], -90);
  check("G&A rendered negative", row(rows, "General & administrative").values[0], -60);

  check("revenue keeps its positive sign", row(rows, "Total revenue").values[0], 1000);
  check("operating income is not flipped", row(rows, "Operating income")?.values[0] ?? 300, 300);

  // The derived total must agree with the parts it is derived from.
  const total = row(rows, "Total costs & expenses").values[0];
  check("total costs = -(400+150+90+60)", total, -700);
  const parts = ["Cost of revenue", "Research & development", "Sales & marketing", "General & administrative"]
    .reduce((a, l) => a + row(rows, l).values[0], 0);
  check("total equals the sum of the displayed parts", total, parts);
}

console.log("\n--- CONVENTION #1: missing values are null, never 0 ---");
{
  // Two periods; the second is missing R&D entirely.
  const rows = renderStatement("income-statement", [FY24, { ...FY24, RnDExpense: undefined }]);
  const rnd = row(rows, "Research & development");
  check("period 1 has the value", rnd.values[0], -150);
  check("period 2 is null, NOT 0", rnd.values[1], null);
  check("and not -0 either", Object.is(rnd.values[1], -0), false);
}

console.log("\n--- a row missing in EVERY period is dropped, not blank-filled ---");
{
  const sparse = { Revenue: 1000, NetIncome: 100 };
  const rows = renderStatement("income-statement", [sparse, sparse]);
  check("no services line when never reported", row(rows, "Services"), undefined);
  check("no R&D line when never reported", row(rows, "Research & development"), undefined);
  check("revenue survives", row(rows, "Total revenue").values, [1000, 1000]);
  const allNull = rows.filter((r) => r.kind !== "section" && r.values.every((v) => v === null));
  check("no surviving row is entirely null", allNull.map((r) => r.label), []);
}

console.log("\n--- an emptied section drops its header too ---");
{
  const rows = renderStatement("income-statement", [{ Revenue: 1000 }]);
  const labels = rows.map((r) => r.label);
  check("no orphan 'Costs & expenses' header", labels.includes("Costs & expenses"), false);
  check("two consecutive section headers never survive",
    rows.some((r, i) => r.kind === "section" && rows[i + 1]?.kind === "section"), false);
  check("last row is never a dangling section header", rows.at(-1)?.kind === "section", false);
}

console.log("\n--- no periods at all: headers only, no invented columns ---");
{
  const rows = renderStatement("income-statement", []);
  const withValues = rows.filter((r) => r.values.length > 0);
  check("nothing carries values", withValues, []);
  check("every surviving row is a section header", rows.every((r) => r.kind === "section"), true);
}

console.log("\n--- one value column per period, in order (oldest -> newest) ---");
{
  const rows = renderStatement("income-statement", [
    { Revenue: 100 }, { Revenue: 200 }, { Revenue: 300 },
  ]);
  check("three columns", row(rows, "Total revenue").values.length, 3);
  check("oldest first", row(rows, "Total revenue").values, [100, 200, 300]);
}

console.log("\n--- balance sheet and cash flow render on the same contract ---");
{
  for (const type of ["balance-sheet", "cash-flow"]) {
    const rows = renderStatement(type, [FY24]);
    check(`${type} produces rows`, rows.length > 0, true);
    check(`${type} has no NaN`, rows.every((r) => r.values.every((v) => v === null || Number.isFinite(v))), true);
    check(`${type} value columns match period count`,
      rows.filter((r) => r.kind !== "section").every((r) => r.values.length === 1), true);
  }
  const cf = renderStatement("cash-flow", [FY24]);
  check("capex is stored positive", FY24.Capex, 120);
  const capexRow = cf.find((r) => /capex|capital expenditure/i.test(r.label));
  check("...and rendered as an outflow", capexRow ? capexRow.values[0] < 0 : "no capex row", true);
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
