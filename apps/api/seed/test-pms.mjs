/**
 * Verifies the portfolio-accounting engine (docs/PORTFOLIO-ACCOUNTING.md §9).
 *
 * Pure-function tests over the FIFO matcher, fee schedule and position
 * aggregation — no database needed. The schema itself is exercised by
 * test-pg.mjs. Run: node seed/test-pms.mjs
 */
// The domain modules are TypeScript. Node 22.6+ strips types natively, so this
// runs the REAL engine — not a copy — with no build step and no drift risk.
import { matchSell, buildPosition } from "../src/domain/matching.ts";
import { estimateFees, totalFees } from "../src/domain/fees.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : actual === expected;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};
const near = (target, tol = 1e-6) => (v) => Math.abs(v - target) < tol;

console.log("--- FIFO matching: the owner's scenario (buy 50, sell 20) ---");
{
  const lots = [
    {
      id: 1,
      openedAt: "2026-01-10T09:30:00Z",
      originalQty: 50,
      remainingQty: 50,
      costPrice: 10,
      feesTotal: 0,
      currency: "USD",
      fxRate: 4.7,
    },
  ];
  const r = matchSell(lots, {
    tradeId: 100,
    closedAt: "2026-03-01T09:30:00Z",
    quantity: 20,
    price: 12,
    currency: "USD",
    fxRate: 4.7,
    feesTotal: 0,
  });
  check("closures produced", r.closures.length, 1);
  check("closed quantity", r.closures[0].quantity, 20);
  check("realized gross (local)", r.closures[0].grossPlLocal, 40);
  check("lot remaining after sell", r.updatedLots[0].remainingQty, 30);
  check("nothing unmatched", r.unmatchedQty, 0);

  const pos = buildPosition("inst", [{ ...lots[0], remainingQty: 30 }]);
  check("position qty", pos.quantity, 30);
  check("position average price", pos.averagePrice, 10);
  check("position cost total", pos.costTotal, 300);
}

console.log("\n--- FIFO across three buys (oldest consumed first) ---");
{
  const lots = [
    { id: 1, openedAt: "2026-01-01T00:00:00Z", originalQty: 100, remainingQty: 100, costPrice: 10, feesTotal: 0, currency: "USD", fxRate: 4.5 },
    { id: 2, openedAt: "2026-02-01T00:00:00Z", originalQty: 100, remainingQty: 100, costPrice: 20, feesTotal: 0, currency: "USD", fxRate: 4.5 },
    { id: 3, openedAt: "2026-03-01T00:00:00Z", originalQty: 100, remainingQty: 100, costPrice: 30, feesTotal: 0, currency: "USD", fxRate: 4.5 },
  ];
  // Sell 150 @ 25: consumes all of lot1 (100) then half of lot2 (50).
  const r = matchSell(lots, {
    tradeId: 200, closedAt: "2026-04-01T00:00:00Z", quantity: 150,
    price: 25, currency: "USD", fxRate: 4.5, feesTotal: 0,
  });
  check("two lots consumed", r.closures.length, 2);
  check("first closure is the oldest lot", r.closures[0].lotId, 1);
  check("lot1 fully consumed", r.closures[0].quantity, 100);
  check("lot1 P&L = 100 x (25-10)", r.closures[0].grossPlLocal, 1500);
  check("lot2 partially consumed", r.closures[1].quantity, 50);
  check("lot2 P&L = 50 x (25-20)", r.closures[1].grossPlLocal, 250);
  check("lot3 untouched", r.closures.some((c) => c.lotId === 3), false);

  // Remaining position: 50 of lot2 @ 20 (=1000) + 100 of lot3 @ 30 (=3000)
  //                   = 4000 over 150 shares -> average 26.666…
  const after = lots.map((l) => {
    const u = r.updatedLots.find((x) => x.id === l.id);
    return u ? { ...l, remainingQty: u.remainingQty } : l;
  });
  const pos = buildPosition("inst", after);
  check("remaining qty", pos.quantity, 150);
  check("remaining cost", pos.costTotal, 4000);
  check("weighted average price", pos.averagePrice, near(26.666667));
}

console.log("\n--- FX decomposition must be exact (§4) ---");
{
  const lots = [{ id: 1, openedAt: "2026-01-01T00:00:00Z", originalQty: 10, remainingQty: 10, costPrice: 100, feesTotal: 0, currency: "USD", fxRate: 4.20 }];
  const r = matchSell(lots, {
    tradeId: 300, closedAt: "2026-06-01T00:00:00Z", quantity: 10,
    price: 130, currency: "USD", fxRate: 4.75, feesTotal: 0,
  });
  const c = r.closures[0];
  // total = 10x130x4.75 − 10x100x4.20 = 6175 − 4200 = 1975
  check("total P&L (base MYR)", c.totalPlBase, near(1975));
  // price = 10x(130−100)x4.20 = 1260 ; fx = 10x130x(4.75−4.20) = 715
  check("price component", c.pricePlBase, near(1260));
  check("fx component", c.fxPlBase, near(715));
  check("price + fx == total (INVARIANT)", c.pricePlBase + c.fxPlBase, near(c.totalPlBase));
}

console.log("\n--- Fees flow through to net P&L (§6) ---");
{
  const lots = [{ id: 1, openedAt: "2026-01-01T00:00:00Z", originalQty: 100, remainingQty: 100, costPrice: 10, feesTotal: 20, currency: "USD", fxRate: 4.5 }];
  const r = matchSell(lots, {
    tradeId: 400, closedAt: "2026-02-01T00:00:00Z", quantity: 50,
    price: 12, currency: "USD", fxRate: 4.5, feesTotal: 15,
  });
  const c = r.closures[0];
  // buy fees pro-rata 20 x 50/100 = 10 ; sell fees pro-rata 15 x 50/50 = 15
  check("allocated fees", c.feesLocal, 25);
  check("gross P&L", c.grossPlLocal, 100);
  check("net P&L after fees", c.netPlLocal, 75);
  check("net < gross (INVARIANT)", c.netPlBase < c.totalPlBase, true);

  // Position break-even must include the unclosed share of entry fees.
  const pos = buildPosition("inst", [{ ...lots[0], remainingQty: 50 }]);
  check("avg price excl. fees", pos.averagePrice, 10);
  check("avg price incl. fees (break-even)", pos.averagePriceWithFees, 10.2);
}

console.log("\n--- Oversell is reported, never silently shorted (§9.2) ---");
{
  const lots = [{ id: 1, openedAt: "2026-01-01T00:00:00Z", originalQty: 10, remainingQty: 10, costPrice: 5, feesTotal: 0, currency: "MYR", fxRate: 1 }];
  const r = matchSell(lots, {
    tradeId: 500, closedAt: "2026-02-01T00:00:00Z", quantity: 25,
    price: 6, currency: "MYR", fxRate: 1, feesTotal: 0,
  });
  check("only what was held got closed", r.closures[0].quantity, 10);
  check("excess reported as unmatched", r.unmatchedQty, 15);
}

console.log("\n--- Matching is idempotent / deterministic (§9.5) ---");
{
  const mk = () => [
    { id: 1, openedAt: "2026-01-01T00:00:00Z", originalQty: 40, remainingQty: 40, costPrice: 7, feesTotal: 4, currency: "MYR", fxRate: 1 },
    { id: 2, openedAt: "2026-01-05T00:00:00Z", originalQty: 60, remainingQty: 60, costPrice: 9, feesTotal: 6, currency: "MYR", fxRate: 1 },
  ];
  const sell = { tradeId: 600, closedAt: "2026-02-01T00:00:00Z", quantity: 70, price: 11, currency: "MYR", fxRate: 1, feesTotal: 7 };
  const a = JSON.stringify(matchSell(mk(), sell).closures);
  const b = JSON.stringify(matchSell(mk(), sell).closures);
  check("same inputs produce identical closures", a === b, true);
}

console.log("\n--- Fee schedule per market (§6) ---");
{
  const my = estimateFees({ market: "MY", side: "buy", quantity: 1000, price: 5, tradedAt: "2026-07-01" });
  // value = RM5,000 -> brokerage max(8, 5) = 8 ; clearing 1.5 ; stamp 5 x 1.5 = 7.5
  check("Bursa fee kinds", my.map((f) => f.kind).sort().join(","), "clearing,commission,stamp_duty");
  check("Bursa total (RM5,000 trade)", totalFees(my), near(17, 0.01));

  const usBuy = estimateFees({ market: "US", side: "buy", quantity: 100, price: 50, tradedAt: "2026-07-01" });
  const usSell = estimateFees({ market: "US", side: "sell", quantity: 100, price: 50, tradedAt: "2026-07-01" });
  check("US buy has no regulatory levy", usBuy.some((f) => f.kind === "regulatory"), false);
  check("US sell adds regulatory levy", usSell.some((f) => f.kind === "regulatory"), true);
  check("US sell costs more than buy", totalFees(usSell) > totalFees(usBuy), true);

  const hk = estimateFees({ market: "HK", side: "buy", quantity: 1000, price: 20, tradedAt: "2026-07-01" });
  check("HK includes stamp duty", hk.some((f) => f.kind === "stamp_duty"), true);
  check("HK stamp duty rounds up to the dollar", hk.find((f) => f.kind === "stamp_duty").amount, 20);

  check("fees are never negative", [...my, ...usSell, ...hk].every((f) => f.amount >= 0), true);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
