/**
 * Verifies the ratio engine (P004).
 *
 * Its contract is stated at the top of ratios.ts and is the reason the UI can
 * be trusted: "a ratio is `undefined` when any input is missing or the
 * denominator is zero — never 0, never NaN". That distinction is the whole
 * ballgame. A missing margin rendered as 0% is a fabricated number about a
 * real company, which repo convention #1 forbids; `undefined` renders as "—".
 *
 * The other invariant checked here is the sign convention from concepts.ts:
 * facts hold positive MAGNITUDES for outflows, and the engine applies the
 * sign. Get that backwards and free cash flow silently doubles.
 */
import {
  derivePeriod,
  deriveSeries,
  direction,
  fmt,
  freeCashFlow,
  sparkline,
} from "../src/domain/ratios.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

/** Every key DerivedPeriod can produce — kept explicit so a new ratio that
 *  forgets the missing-input contract shows up here rather than in the UI. */
const ALL_KEYS = [
  "grossMarginPct", "operatingMarginPct", "netMarginPct", "revenueGrowthPct",
  "fcf", "fcfMarginPct", "returnOnEquityPct", "currentRatio", "quickRatio",
  "cashRatio", "debtToEquity", "netDebtToEbitda", "interestCoverage",
  "assetTurnover", "inventoryTurnover", "receivableDays", "cashConversionPct",
  "eps",
];

console.log("--- no facts: everything is undefined, nothing is 0 or NaN ---");
{
  const d = derivePeriod({});
  const zeros = ALL_KEYS.filter((k) => d[k] === 0);
  const nans = ALL_KEYS.filter((k) => Number.isNaN(d[k]));
  const defined = ALL_KEYS.filter((k) => d[k] !== undefined);
  check("no ratio came back as 0", zeros, []);
  check("no ratio came back as NaN", nans, []);
  check("every ratio is undefined", defined, []);
}

console.log("\n--- a zero denominator is undefined, not Infinity ---");
{
  const d = derivePeriod({
    Revenue: 0, NetIncome: 50, TotalEquity: 0, CurrentLiabilities: 0,
    CurrentAssets: 100, InterestExpense: 0, OperatingIncome: 10,
    DilutedShares: 0, AccountsReceivable: 20,
  });
  check("net margin on zero revenue", d.netMarginPct, undefined);
  check("ROE on zero equity", d.returnOnEquityPct, undefined);
  check("current ratio on zero liabilities", d.currentRatio, undefined);
  check("interest coverage on zero interest", d.interestCoverage, undefined);
  check("EPS on zero shares", d.eps, undefined);
  check("receivable days on zero revenue", d.receivableDays, undefined);
  const bad = ALL_KEYS.filter((k) => d[k] !== undefined && !Number.isFinite(d[k]));
  check("nothing is Infinity", bad, []);
}

console.log("\n--- margins compute correctly from magnitudes ---");
{
  const d = derivePeriod({
    Revenue: 1000, CostOfRevenue: 400, OperatingIncome: 250, NetIncome: 180,
  });
  check("gross margin = (1000-400)/1000", d.grossMarginPct, 60);
  check("operating margin", d.operatingMarginPct, 25);
  check("net margin", d.netMarginPct, 18);
}

console.log("\n--- free cash flow subtracts capex (facts are positive magnitudes) ---");
{
  check("FCF = OCF - capex", freeCashFlow({ OperatingCashFlow: 500, Capex: 120 }), 380);
  check("capex is NOT added (sign convention)", freeCashFlow({ OperatingCashFlow: 500, Capex: 120 }) === 620, false);
  check("missing capex -> undefined, not OCF", freeCashFlow({ OperatingCashFlow: 500 }), undefined);
  check("missing OCF -> undefined", freeCashFlow({ Capex: 120 }), undefined);
  check("negative FCF is a real answer, not undefined", freeCashFlow({ OperatingCashFlow: 100, Capex: 250 }), -150);

  const d = derivePeriod({ Revenue: 1000, OperatingCashFlow: 500, Capex: 250 });
  check("FCF margin", d.fcfMarginPct, 25);
}

console.log("\n--- total debt: one side missing is 0, both missing is undefined ---");
{
  const both = derivePeriod({ LongTermDebt: 600, ShortTermDebt: 200, TotalEquity: 800 });
  check("D/E uses long + short", both.debtToEquity, 1);
  const longOnly = derivePeriod({ LongTermDebt: 800, TotalEquity: 800 });
  check("missing short-term counts as 0", longOnly.debtToEquity, 1);
  const neither = derivePeriod({ TotalEquity: 800 });
  check("no debt facts at all -> undefined, NOT zero debt", neither.debtToEquity, undefined);
}

console.log("\n--- growth needs the prior period ---");
{
  check("no prior -> undefined", derivePeriod({ Revenue: 1200 }).revenueGrowthPct, undefined);
  check("with prior", derivePeriod({ Revenue: 1200 }, { Revenue: 1000 }).revenueGrowthPct, 20);
  check("a decline is negative, not undefined", derivePeriod({ Revenue: 800 }, { Revenue: 1000 }).revenueGrowthPct, -20);
  check("prior revenue of 0 -> undefined, not Infinity", derivePeriod({ Revenue: 800 }, { Revenue: 0 }).revenueGrowthPct, undefined);
}

console.log("\n--- deriveSeries threads prior periods in order ---");
{
  const s = deriveSeries([{ Revenue: 100 }, { Revenue: 150 }, { Revenue: 300 }]);
  check("three periods out", s.length, 3);
  check("first has no growth (nothing before it)", s[0].revenueGrowthPct, undefined);
  check("second grows 50%", s[1].revenueGrowthPct, 50);
  check("third grows 100%", s[2].revenueGrowthPct, 100);
}

console.log("\n--- quick ratio excludes inventory; needs it to be known ---");
{
  const d = derivePeriod({ CurrentAssets: 500, Inventory: 200, CurrentLiabilities: 100 });
  check("current ratio 5.0", d.currentRatio, 5);
  check("quick ratio 3.0", d.quickRatio, 3);
  const noInv = derivePeriod({ CurrentAssets: 500, CurrentLiabilities: 100 });
  check("unknown inventory -> quick ratio undefined, not equal to current", noInv.quickRatio, undefined);
}

console.log("\n--- formatters render missing as an em dash, never 0 ---");
{
  check("pct(undefined)", fmt.pct(undefined), "—");
  check("turns(undefined)", fmt.turns(undefined), "—");
  check("days(undefined)", fmt.days(undefined), "—");
  check("pct(0) is a real zero", fmt.pct(0), "0.0%");
  check("pct rounds to 1dp", fmt.pct(12.345), "12.3%");
  check("turns", fmt.turns(3.14159), "3.1x");
  check("delta is signed", fmt.deltaPts(12, 10), "+2.0pt");
  check("negative delta", fmt.deltaPts(10, 12), "-2.0pt");
  check("delta with a missing side is undefined", fmt.deltaPts(10, undefined), undefined);
}

console.log("\n--- direction flips for metrics where lower is better ---");
{
  check("margin up is good", direction(20, 15), "up");
  check("margin down is bad", direction(15, 20), "down");
  check("receivable days up is BAD", direction(60, 45, false), "down");
  check("receivable days down is GOOD", direction(45, 60, false), "up");
  check("unchanged -> undefined", direction(20, 20), undefined);
  check("missing side -> undefined", direction(20, undefined), undefined);
}

console.log("\n--- sparkline needs two real points ---");
{
  const s = deriveSeries([{ Revenue: 100, NetIncome: 10 }, { Revenue: 200, NetIncome: 40 }]);
  check("two points", sparkline(s, (d) => d.netMarginPct), [10, 20]);
  check("one point is not a trend", sparkline([s[0]], (d) => d.netMarginPct), undefined);
  check("missing points are dropped, not zero-filled",
    sparkline(deriveSeries([{ Revenue: 100, NetIncome: 10 }, { Revenue: 200 }]), (d) => d.netMarginPct),
    undefined);
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
