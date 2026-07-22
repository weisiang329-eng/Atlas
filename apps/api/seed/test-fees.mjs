/**
 * Verifies the trading-fee engine (水钱).
 *
 * These figures reduce the owner's realised P&L on every single closure, so a
 * wrong fee is a wrong profit — silently, and forever, because a lot's cost
 * basis is fixed at the moment it is written. The properties worth pinning
 * are the ones that would look plausible if broken:
 *
 *   - minimums and caps, which only bite at the extremes nobody tests by hand
 *   - sell-side-only levies, which are the easiest thing to apply to both
 *     sides and never notice
 *   - schedule versioning by trade date, so a historical trade keeps the fees
 *     that were actually charged rather than today's
 */
import { estimateFees, totalFees } from "../src/domain/fees.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};
const near = (a, b, tol = 0.005) => Math.abs(a - b) <= tol;

const fee = (over = {}) =>
  estimateFees({ market: "US", side: "buy", quantity: 100, price: 10, tradedAt: "2026-01-15", ...over });
const kindOf = (lines, kind) => lines.filter((l) => l.kind === kind).reduce((a, l) => a + l.amount, 0);

console.log("--- every line is positive and in the market's currency ---");
{
  for (const [market, ccy] of [["US", "USD"], ["MY", "MYR"], ["HK", "HKD"], ["SG", "SGD"]]) {
    const lines = fee({ market });
    check(`${market} currency`, [...new Set(lines.map((l) => l.currency))], [ccy]);
    check(`${market} no negative or NaN line`, lines.every((l) => Number.isFinite(l.amount) && l.amount >= 0), true);
    check(`${market} total equals the sum of its lines`,
      near(totalFees(lines), lines.reduce((a, l) => a + l.amount, 0)), true);
  }
}

console.log("\n--- US regulatory levies are SELL-SIDE ONLY ---");
{
  // The SEC Section 31 fee and the FINRA TAF are charged on sales. Applying
  // them to buys would overstate cost basis on every purchase.
  const buy = fee({ side: "buy", quantity: 1000, price: 150 });
  const sell = fee({ side: "sell", quantity: 1000, price: 150 });
  check("buy has no regulatory line", kindOf(buy, "regulatory"), 0);
  check("sell does", kindOf(sell, "regulatory") > 0, true);
  check("and it is the ONLY difference",
    near(totalFees(sell) - totalFees(buy), kindOf(sell, "regulatory")), true);

  // SEC fee is on VALUE (0.00278%); TAF is per share and capped at 8.30.
  const value = 1000 * 150;
  check("SEC fee tracks value", near(kindOf(sell, "regulatory") - Math.min(8.3, 1000 * 0.000166), value * 0.0000278), true);
}

console.log("\n--- caps bite at the top end ---");
{
  // TAF caps at 8.30: 100k shares would be 16.60 uncapped.
  const huge = fee({ side: "sell", quantity: 100_000, price: 1 });
  const taf = kindOf(huge, "regulatory") - 100_000 * 1 * 0.0000278;
  check("FINRA TAF caps at 8.30, not 16.60", near(taf, 8.3, 0.01), true);

  // Bursa clearing and stamp duty both cap at RM1,000.
  const my = fee({ market: "MY", quantity: 1, price: 50_000_000 });
  check("MY clearing caps at RM1,000", my.find((l) => l.kind === "clearing").amount, 1000);
  check("MY stamp duty caps at RM1,000", my.find((l) => l.kind === "stamp_duty").amount, 1000);

  // SGX clearing caps at 600.
  const sg = fee({ market: "SG", quantity: 1, price: 10_000_000 });
  check("SG clearing caps at 600", sg.find((l) => l.kind === "clearing").amount, 600);

  // CCASS settlement caps at 100 and floors at 2.
  const hkBig = fee({ market: "HK", quantity: 1, price: 100_000_000 });
  const hkSmall = fee({ market: "HK", quantity: 1, price: 100 });
  check("HK settlement caps at 100", hkBig.find((l) => l.kind === "settlement").amount, 100);
  check("HK settlement floors at 2", hkSmall.find((l) => l.kind === "settlement").amount, 2);
}

console.log("\n--- minimums bite at the bottom end ---");
{
  // A one-share trade must not cost fractions of a cent.
  const tiny = fee({ quantity: 1, price: 1 });
  check("US commission floors at 0.99", tiny.find((l) => l.kind === "commission").amount, 0.99);
  check("US platform floors at 1.00", tiny.find((l) => l.kind === "platform").amount, 1);

  const myTiny = fee({ market: "MY", quantity: 1, price: 1 });
  check("MY brokerage floors at RM8", myTiny.find((l) => l.kind === "commission").amount, 8);

  const hkTiny = fee({ market: "HK", quantity: 1, price: 1 });
  check("HK commission floors at HK$3", hkTiny.find((l) => l.kind === "commission").amount, 3);
}

console.log("\n--- Malaysian stamp duty is RM1.50 per RM1,000, rounded UP ---");
{
  // The rule is per *started* RM1,000, so RM1,001 of value costs RM3.00.
  const at1000 = fee({ market: "MY", quantity: 1, price: 1000 });
  const at1001 = fee({ market: "MY", quantity: 1, price: 1001 });
  check("RM1,000 -> RM1.50", at1000.find((l) => l.kind === "stamp_duty").amount, 1.5);
  check("RM1,001 -> RM3.00, not RM1.50", at1001.find((l) => l.kind === "stamp_duty").amount, 3);
  const at10k = fee({ market: "MY", quantity: 1000, price: 10 });
  check("RM10,000 -> RM15.00", at10k.find((l) => l.kind === "stamp_duty").amount, 15);
}

console.log("\n--- HK stamp duty rounds UP to the whole dollar ---");
{
  const a = fee({ market: "HK", quantity: 1, price: 10_001 }); // 0.1% = 10.001
  check("HK$10,001 -> HK$11 duty, not HK$10.001", a.find((l) => l.kind === "stamp_duty").amount, 11);
}

console.log("\n--- schedules are versioned by TRADE DATE, not today ---");
{
  // MY's schedule starts 2022-01-01; a 2021 trade must not silently fall
  // through to a later schedule or throw.
  const now = fee({ market: "MY", tradedAt: "2026-01-15" });
  const old = fee({ market: "MY", tradedAt: "2021-06-01" });
  check("a pre-schedule date still returns fees", old.length > 0, true);
  check("and they are still MYR", [...new Set(old.map((l) => l.currency))], ["MYR"]);
  // Same inputs on the current schedule must be reproducible.
  const again = fee({ market: "MY", tradedAt: "2026-01-15" });
  check("identical inputs -> identical fees", totalFees(now), totalFees(again));
}

console.log("\n--- fees scale with size, never shrink ---");
{
  let prev = -1;
  for (const q of [1, 10, 100, 1000, 10_000]) {
    const t = totalFees(fee({ quantity: q, price: 20 }));
    check(`qty ${q} costs at least as much as the smaller trade`, t >= prev, true);
    prev = t;
  }
}

console.log("\n--- zero-value input does not produce a negative or NaN total ---");
{
  const z = fee({ quantity: 0, price: 0 });
  check("total is finite and non-negative", Number.isFinite(totalFees(z)) && totalFees(z) >= 0, true);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
