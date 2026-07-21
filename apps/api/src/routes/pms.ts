/**
 * /v1/pms — the trade book (docs/PORTFOLIO-ACCOUNTING.md).
 *
 * Atlas is the book of record: the broker executes, this keeps the accounts.
 * Trades are the only thing written directly; lots, closures and positions are
 * REPLAYED from them, so the book can always be reconstructed and an
 * out-of-order import or a correction can never leave stale derived state.
 *
 * Writes are the first mutating endpoints in Atlas. They are single-user by
 * design; access is gated at the edge by Cloudflare Access (HANDOFF §8).
 */
import { Hono } from "hono";
import type { Env } from "../index";
import {
  resetDerived,
  createDb,
  deleteTradeCascade,
  ensureAccount,
  ensureInstrument,
  insertClosures,
  upsertLot,
  insertTrade,
  insertTradeFees,
  listAllLots,
  listClosures,
  listInstruments,
  listTradeFees,
  listTrades,
  updateLotRemaining,
} from "../db/repo";
import { estimateFees, totalFees, type Market } from "../domain/fees";
import { buildPosition, matchSell, type OpenLot } from "../domain/matching";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const pms = new Hono<AppEnv>();

/** Single-user platform: one implicit account until multi-user auth exists. */
const ACCOUNT_ID = "default";
const MARKET_CURRENCY: Record<Market, string> = {
  US: "USD",
  MY: "MYR",
  HK: "HKD",
  SG: "SGD",
};
const MARKETS: Market[] = ["US", "MY", "HK", "SG"];

const instrumentId = (market: string, symbol: string) =>
  `${market}:${symbol}`.toUpperCase();

async function account(db: ReturnType<typeof createDb>) {
  return ensureAccount(db, {
    id: ACCOUNT_ID,
    name: "Primary",
    broker: "manual",
    baseCurrency: "MYR",
  });
}

/**
 * Rebuild every lot and closure from the trade list.
 *
 * A full replay rather than an incremental update: it is O(trades), which at
 * personal-book scale is nothing, and it makes backdated entries and deletions
 * correct by construction instead of by careful bookkeeping.
 */
async function replay(db: ReturnType<typeof createDb>) {
  await resetDerived(db, ACCOUNT_ID);

  const trades = await listTrades(db, ACCOUNT_ID);
  const feeRows = await listTradeFees(db, trades.map((t) => t.id));
  const feesByTrade = new Map<number, number>();
  for (const f of feeRows) {
    feesByTrade.set(f.tradeId, (feesByTrade.get(f.tradeId) ?? 0) + f.amount);
  }

  // Lots currently open, per instrument, as the replay progresses.
  const openByInstrument = new Map<string, OpenLot[]>();

  for (const t of trades) {
    const fees = feesByTrade.get(t.id) ?? 0;

    if (t.side === "buy") {
      const lot = await upsertLot(db, {
        accountId: ACCOUNT_ID,
        instrumentId: t.instrumentId,
        tradeId: t.id,
        openedAt: t.tradedAt,
        originalQty: t.quantity,
        remainingQty: t.quantity,
        costPrice: t.price,
        feesTotal: fees,
        currency: t.currency,
        fxRate: t.fxRate,
      });
      const list = openByInstrument.get(t.instrumentId) ?? [];
      list.push({
        id: lot.id,
        openedAt: lot.openedAt,
        originalQty: lot.originalQty,
        remainingQty: lot.remainingQty,
        costPrice: lot.costPrice,
        feesTotal: lot.feesTotal,
        currency: lot.currency,
        fxRate: lot.fxRate,
      });
      openByInstrument.set(t.instrumentId, list);
      continue;
    }

    const open = openByInstrument.get(t.instrumentId) ?? [];
    const result = matchSell(
      open,
      {
        tradeId: t.id,
        closedAt: t.tradedAt,
        quantity: t.quantity,
        price: t.price,
        currency: t.currency,
        fxRate: t.fxRate,
        feesTotal: fees,
      },
      "fifo",
    );

    await insertClosures(
      db,
      result.closures.map((c) => ({
        lotId: c.lotId,
        sellTradeId: c.sellTradeId,
        closedAt: c.closedAt,
        quantity: c.quantity,
        costPrice: c.costPrice,
        sellPrice: c.sellPrice,
        feesLocal: c.feesLocal,
        grossPlLocal: c.grossPlLocal,
        netPlLocal: c.netPlLocal,
        currency: c.currency,
        buyFxRate: c.buyFxRate,
        sellFxRate: c.sellFxRate,
        totalPlBase: c.totalPlBase,
        pricePlBase: c.pricePlBase,
        fxPlBase: c.fxPlBase,
        netPlBase: c.netPlBase,
      })),
    );

    for (const u of result.updatedLots) {
      await updateLotRemaining(db, u.id, u.remainingQty);
      const lot = open.find((l) => l.id === u.id);
      if (lot) lot.remainingQty = u.remainingQty;
    }
  }
}

/* ── Read ─────────────────────────────────────────────────────────────── */

/** The whole book: positions (总仓), lots and closures (按订单). */
pms.get("/book", async (c) => {
  const db = c.get("db");
  await account(db);

  const [trades, lots, closures, instruments] = await Promise.all([
    listTrades(db, ACCOUNT_ID),
    listAllLots(db, ACCOUNT_ID),
    listClosures(db, ACCOUNT_ID),
    listInstruments(db),
  ]);
  const instById = new Map(instruments.map((i) => [i.id, i]));

  const byInstrument = new Map<string, typeof lots>();
  for (const l of lots) {
    const list = byInstrument.get(l.instrumentId) ?? [];
    list.push(l);
    byInstrument.set(l.instrumentId, list);
  }

  const positions = [...byInstrument.entries()]
    .map(([id, instLots]) => {
      const inst = instById.get(id);
      const pos = buildPosition(
        id,
        instLots.map((l) => ({
          id: l.id,
          openedAt: l.openedAt,
          originalQty: l.originalQty,
          remainingQty: l.remainingQty,
          costPrice: l.costPrice,
          feesTotal: l.feesTotal,
          currency: l.currency,
          fxRate: l.fxRate,
        })),
      );
      const instClosures = closures.filter((cl) =>
        instLots.some((l) => l.id === cl.lotId),
      );
      return {
        instrumentId: id,
        symbol: inst?.symbol ?? id,
        market: inst?.market ?? "US",
        name: inst?.name ?? id,
        currency: inst?.currency ?? "USD",
        // A fully-closed holding has no position but still has history worth
        // showing, so quantity 0 is returned rather than the row being dropped.
        quantity: pos?.quantity ?? 0,
        costTotal: pos?.costTotal ?? 0,
        averagePrice: pos?.averagePrice ?? 0,
        averagePriceWithFees: pos?.averagePriceWithFees ?? 0,
        costTotalBase: pos?.costTotalBase ?? 0,
        openLots: pos?.openLots ?? 0,
        realizedNetBase:
          Math.round(instClosures.reduce((a, cl) => a + cl.netPlBase, 0) * 1e4) / 1e4,
        lots: instLots,
        closures: instClosures,
      };
    })
    .sort((a, b) => b.costTotalBase - a.costTotalBase);

  // Fees are charged in the trade's currency, so each converts at that
  // trade's own rate — the rate that applied when it was actually paid.
  const feeRows = await listTradeFees(db, trades.map((t) => t.id));
  const tradeById = new Map(trades.map((t) => [t.id, t]));
  const totalFeesBase =
    Math.round(
      feeRows.reduce(
        (a, f) => a + f.amount * (tradeById.get(f.tradeId)?.fxRate ?? 1),
        0,
      ) * 1e4,
    ) / 1e4;

  return c.json({
    baseCurrency: "MYR",
    trades,
    positions,
    summary: {
      openPositions: positions.filter((p) => p.quantity > 0).length,
      tradeCount: trades.length,
      costBasisBase:
        Math.round(positions.reduce((a, p) => a + p.costTotalBase, 0) * 1e4) / 1e4,
      realizedNetBase:
        Math.round(positions.reduce((a, p) => a + p.realizedNetBase, 0) * 1e4) / 1e4,
      totalFeesBase,
    },
  });
});

/** Fee estimate for a prospective trade — lets the UI preview before saving. */
pms.get("/fees/estimate", async (c) => {
  const market = c.req.query("market") as Market | undefined;
  const side = c.req.query("side") === "sell" ? "sell" : "buy";
  const quantity = Number(c.req.query("quantity") ?? 0);
  const price = Number(c.req.query("price") ?? 0);
  const tradedAt = c.req.query("tradedAt") ?? new Date().toISOString().slice(0, 10);

  if (!market || !MARKETS.includes(market)) {
    return c.json({ error: "market must be one of US, MY, HK, SG." }, 400);
  }
  if (!(quantity > 0) || !(price > 0)) {
    return c.json({ error: "quantity and price must be positive." }, 400);
  }

  const lines = estimateFees({ market, side, quantity, price, tradedAt });
  return c.json({
    lines,
    total: totalFees(lines),
    currency: MARKET_CURRENCY[market],
  });
});

/* ── Write ────────────────────────────────────────────────────────────── */

interface TradeBody {
  symbol?: unknown;
  name?: unknown;
  market?: unknown;
  side?: unknown;
  quantity?: unknown;
  price?: unknown;
  fxRate?: unknown;
  tradedAt?: unknown;
  fees?: unknown;
  note?: unknown;
}

pms.post("/trades", async (c) => {
  const db = c.get("db");
  await account(db);

  let body: TradeBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Expected a JSON body." }, 400);
  }

  const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  const market = body.market as Market;
  const side = body.side === "sell" ? "sell" : "buy";
  const quantity = Number(body.quantity);
  const price = Number(body.price);
  const tradedAt =
    typeof body.tradedAt === "string" && body.tradedAt
      ? body.tradedAt
      : new Date().toISOString();

  if (!symbol) return c.json({ error: "symbol is required." }, 400);
  if (!MARKETS.includes(market)) {
    return c.json({ error: "market must be one of US, MY, HK, SG." }, 400);
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return c.json({ error: "quantity must be a positive number." }, 400);
  }
  if (!Number.isFinite(price) || price < 0) {
    return c.json({ error: "price must be zero or greater." }, 400);
  }

  const currency = MARKET_CURRENCY[market];
  const fxRate = Number.isFinite(Number(body.fxRate)) && Number(body.fxRate) > 0
    ? Number(body.fxRate)
    : 1;

  const id = instrumentId(market, symbol);
  await ensureInstrument(db, {
    id,
    symbol,
    market,
    currency,
    name: typeof body.name === "string" && body.name ? body.name : symbol,
  });

  const trade = await insertTrade(db, {
    accountId: ACCOUNT_ID,
    instrumentId: id,
    side,
    quantity,
    price,
    currency,
    fxRate,
    tradedAt,
    note: typeof body.note === "string" ? body.note : null,
    sourceKind: "manual",
  });

  // Fees: use the caller's actual figure when given, otherwise the schedule's
  // estimate. The basis is recorded so reconciliation can report the drift.
  const override = Number(body.fees);
  if (Number.isFinite(override) && override >= 0) {
    await insertTradeFees(db, [
      { tradeId: trade.id, kind: "other", amount: override, currency, basis: "actual" },
    ]);
  } else {
    const lines = estimateFees({
      market,
      side,
      quantity,
      price,
      tradedAt: tradedAt.slice(0, 10),
    });
    await insertTradeFees(
      db,
      lines.map((l) => ({
        tradeId: trade.id,
        kind: l.kind,
        amount: l.amount,
        currency: l.currency,
        basis: "estimated" as const,
      })),
    );
  }

  await replay(db);
  return c.json({ trade }, 201);
});

pms.delete("/trades/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "Invalid trade id." }, 400);

  await account(db);
  await deleteTradeCascade(db, ACCOUNT_ID, id);
  // Deleting a buy can orphan closures matched against its lot, so the book is
  // always replayed rather than patched.
  await replay(db);
  return c.json({ ok: true });
});
