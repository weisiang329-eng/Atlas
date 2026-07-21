/**
 * End-to-end test of the trade book against a REAL Postgres engine (PGlite).
 *
 * test-pms.mjs proves the matching maths in isolation; this proves the whole
 * path — schema, inserts, the replay engine, and the derived book — because a
 * pure-function test cannot catch a wrong column, a broken cascade, or a
 * replay that leaves stale lots behind.
 *
 * Run: node --experimental-strip-types seed/test-pms-db.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { matchSell, buildPosition } from "../src/domain/matching.ts";
import { estimateFees, totalFees } from "../src/domain/fees.ts";

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : actual === expected;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};
const near = (t, tol = 1e-4) => (v) => Math.abs(v - t) < tol;

const db = new PGlite();
console.log("applying migrations...");
for (const m of [
  "drizzle/0000_init_postgres.sql",
  "drizzle/0001_agent_usage.sql",
  "drizzle/0002_pms.sql",
]) {
  await db.exec(read(m));
}

const one = async (sql) => (await db.query(sql)).rows[0];
const all = async (sql) => (await db.query(sql)).rows;

console.log("\n--- schema accepts the book ---");
await db.exec(`
  INSERT INTO pms_account (id, name, broker, base_currency)
  VALUES ('default', 'Primary', 'manual', 'MYR')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO pms_instrument (id, symbol, market, currency, name)
  VALUES ('US:NVDA', 'NVDA', 'US', 'USD', 'NVIDIA Corporation')
  ON CONFLICT (id) DO NOTHING;
`);
check("account created", (await one("SELECT count(*)::int n FROM pms_account")).n, 1);
check("booking method defaults to fifo",
  (await one("SELECT booking_method FROM pms_account WHERE id='default'")).booking_method, "fifo");

// The owner's scenario, with the second buy at a different FX rate.
const trades = [
  { side: "buy",  qty: 50, price: 10, fx: 4.5, at: "2026-01-10T00:00:00Z" },
  { side: "buy",  qty: 30, price: 14, fx: 4.6, at: "2026-02-10T00:00:00Z" },
  { side: "sell", qty: 20, price: 12, fx: 4.8, at: "2026-03-10T00:00:00Z" },
];
for (const t of trades) {
  const fees = totalFees(
    estimateFees({ market: "US", side: t.side, quantity: t.qty, price: t.price, tradedAt: t.at.slice(0, 10) }),
  );
  const r = await db.query(
    `INSERT INTO pms_trade (account_id, instrument_id, side, quantity, price, currency, fx_rate, traded_at, source_kind)
     VALUES ('default','US:NVDA',$1,$2,$3,'USD',$4,$5,'manual') RETURNING id`,
    [t.side, t.qty, t.price, t.fx, t.at],
  );
  await db.query(
    `INSERT INTO pms_trade_fee (trade_id, kind, amount, currency, basis)
     VALUES ($1,'other',$2,'USD','estimated')`,
    [r.rows[0].id, fees],
  );
}
check("trades stored", (await one("SELECT count(*)::int n FROM pms_trade")).n, 3);

console.log("\n--- replay produces the book ---");
// Mirror of routes/pms.ts replay(), exercised against the real tables.
async function replay() {
  // Closures are cleared, lots are REWOUND (not deleted) so their ids survive —
  // specific-lot selling stores lot ids, and regenerating serials every replay
  // would silently invalidate them.
  await db.exec(`
    DELETE FROM pms_lot_closure WHERE lot_id IN (SELECT id FROM pms_lot WHERE account_id='default');
    UPDATE pms_lot SET remaining_qty = original_qty WHERE account_id='default';
  `);
  const rows = await all(
    `SELECT t.*, COALESCE(SUM(f.amount),0) AS fees
     FROM pms_trade t LEFT JOIN pms_trade_fee f ON f.trade_id = t.id
     WHERE t.account_id='default'
     GROUP BY t.id ORDER BY t.traded_at, t.id`,
  );
  const open = [];
  for (const t of rows) {
    const fees = Number(t.fees);
    if (t.side === "buy") {
      // Upsert on trade_id — the stable identity of a lot.
      const lot = await db.query(
        `INSERT INTO pms_lot (account_id, instrument_id, trade_id, opened_at, original_qty, remaining_qty, cost_price, fees_total, currency, fx_rate)
         VALUES ('default','US:NVDA',$1,$2,$3,$3,$4,$5,'USD',$6)
         ON CONFLICT (trade_id) DO UPDATE SET
           original_qty = EXCLUDED.original_qty, remaining_qty = EXCLUDED.remaining_qty,
           cost_price = EXCLUDED.cost_price, fees_total = EXCLUDED.fees_total,
           fx_rate = EXCLUDED.fx_rate
         RETURNING id`,
        [t.id, t.traded_at, Number(t.quantity), Number(t.price), fees, Number(t.fx_rate)],
      );
      open.push({
        id: lot.rows[0].id, openedAt: t.traded_at,
        originalQty: Number(t.quantity), remainingQty: Number(t.quantity),
        costPrice: Number(t.price), feesTotal: fees, currency: "USD", fxRate: Number(t.fx_rate),
      });
      continue;
    }
    const res = matchSell(open, {
      tradeId: t.id, closedAt: t.traded_at, quantity: Number(t.quantity),
      price: Number(t.price), currency: "USD", fxRate: Number(t.fx_rate), feesTotal: fees,
    }, "fifo");
    for (const cl of res.closures) {
      await db.query(
        `INSERT INTO pms_lot_closure (lot_id, sell_trade_id, closed_at, quantity, cost_price, sell_price,
           fees_local, gross_pl_local, net_pl_local, currency, buy_fx_rate, sell_fx_rate,
           total_pl_base, price_pl_base, fx_pl_base, net_pl_base)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'USD',$10,$11,$12,$13,$14,$15)`,
        [cl.lotId, cl.sellTradeId, cl.closedAt, cl.quantity, cl.costPrice, cl.sellPrice,
         cl.feesLocal, cl.grossPlLocal, cl.netPlLocal, cl.buyFxRate, cl.sellFxRate,
         cl.totalPlBase, cl.pricePlBase, cl.fxPlBase, cl.netPlBase],
      );
    }
    for (const u of res.updatedLots) {
      await db.query(`UPDATE pms_lot SET remaining_qty=$1 WHERE id=$2`, [u.remainingQty, u.id]);
      const l = open.find((x) => x.id === u.id);
      if (l) l.remainingQty = u.remainingQty;
    }
  }
}
await replay();

check("lots created (one per buy)", (await one("SELECT count(*)::int n FROM pms_lot")).n, 2);
check("one closure written", (await one("SELECT count(*)::int n FROM pms_lot_closure")).n, 1);

const cl = await one("SELECT * FROM pms_lot_closure LIMIT 1");
check("FIFO closed the OLDEST lot's cost", Number(cl.cost_price), 10);
check("price P&L = 20 x (12-10) x 4.5", Number(cl.price_pl_base), near(180));
check("fx P&L = 20 x 12 x (4.8-4.5)", Number(cl.fx_pl_base), near(72));
check("price + fx == total (INVARIANT)",
  Number(cl.price_pl_base) + Number(cl.fx_pl_base), near(Number(cl.total_pl_base)));
check("net is below gross (fees bite)", Number(cl.net_pl_base) < Number(cl.total_pl_base), true);

const lots = await all("SELECT * FROM pms_lot ORDER BY opened_at");
check("oldest lot part-consumed", Number(lots[0].remaining_qty), 30);
check("newest lot untouched", Number(lots[1].remaining_qty), 30);
check("remaining never exceeds original (INVARIANT)",
  lots.every((l) => Number(l.remaining_qty) <= Number(l.original_qty)), true);

const pos = buildPosition("US:NVDA", lots.map((l) => ({
  id: l.id, openedAt: l.opened_at, originalQty: Number(l.original_qty),
  remainingQty: Number(l.remaining_qty), costPrice: Number(l.cost_price),
  feesTotal: Number(l.fees_total), currency: "USD", fxRate: Number(l.fx_rate),
})));
check("position quantity", pos.quantity, 60);
check("position average price", pos.averagePrice, near(12));
check("break-even average includes entry fees", pos.averagePriceWithFees > pos.averagePrice, true);

console.log("\n--- replay is idempotent, and lot identity survives (INVARIANT §9.5) ---");
const lotIdsBefore = (await all("SELECT id, trade_id FROM pms_lot ORDER BY trade_id"))
  .map((l) => `${l.trade_id}:${l.id}`).join(",");
const before = JSON.stringify(
  await all("SELECT lot_id, quantity, net_pl_base, price_pl_base, fx_pl_base FROM pms_lot_closure ORDER BY lot_id"),
);

await replay();

const lotIdsAfter = (await all("SELECT id, trade_id FROM pms_lot ORDER BY trade_id"))
  .map((l) => `${l.trade_id}:${l.id}`).join(",");
const after = JSON.stringify(
  await all("SELECT lot_id, quantity, net_pl_base, price_pl_base, fx_pl_base FROM pms_lot_closure ORDER BY lot_id"),
);

check("closures are byte-identical after replay", before === after, true);
check("lot ids are STABLE across replay", lotIdsBefore === lotIdsAfter, true);
check("no duplicate lots after replay", (await one("SELECT count(*)::int n FROM pms_lot")).n, 2);
check("no duplicate closures after replay", (await one("SELECT count(*)::int n FROM pms_lot_closure")).n, 1);

console.log("\n--- deleting a buy cascades and the book stays consistent ---");
const firstBuy = await one("SELECT id FROM pms_trade WHERE side='buy' ORDER BY traded_at LIMIT 1");
await db.query("DELETE FROM pms_trade WHERE id=$1", [firstBuy.id]);
check("its lot cascaded away", (await one("SELECT count(*)::int n FROM pms_lot")).n, 1);
check("its closure cascaded away", (await one("SELECT count(*)::int n FROM pms_lot_closure")).n, 0);
await replay();
const afterDelete = await all("SELECT * FROM pms_lot_closure");
check("replay re-matches the sell against the surviving lot", afterDelete.length, 1);
check("now closed at the SECOND lot's cost (14)", Number(afterDelete[0].cost_price), 14);
check("and that turns the trade into a loss", Number(afterDelete[0].total_pl_base) < 0, true);

console.log("\n--- constraints hold ---");
let rejected = false;
try {
  await db.query(
    `INSERT INTO pms_trade (account_id, instrument_id, side, quantity, price, currency, traded_at)
     VALUES ('default','US:NVDA','buy',-5,10,'USD','2026-04-01T00:00:00Z')`,
  );
} catch {
  rejected = true;
}
check("negative quantity rejected by CHECK", rejected, true);

let sideRejected = false;
try {
  await db.query(
    `INSERT INTO pms_trade (account_id, instrument_id, side, quantity, price, currency, traded_at)
     VALUES ('default','US:NVDA','short',5,10,'USD','2026-04-01T00:00:00Z')`,
  );
} catch {
  sideRejected = true;
}
check("invalid side rejected by CHECK", sideRejected, true);

await db.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
