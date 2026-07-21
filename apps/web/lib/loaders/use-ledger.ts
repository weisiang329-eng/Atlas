"use client";

/**
 * Trade ledger — the owner's own book, stored locally until the API routes and
 * the Moomoo sync land (docs/PORTFOLIO-ACCOUNTING.md §10).
 *
 * The accounting itself mirrors the server engine exactly: the same FIFO
 * matching, the same fee allocation, the same FX decomposition. When the API
 * routes ship, this hook swaps its storage for `apiFetch` and every view above
 * it keeps working — the shapes are the engine's shapes.
 */
import { useCallback, useEffect, useState } from "react";

export type Market = "US" | "MY" | "HK" | "SG";
export type Side = "buy" | "sell";

export const MARKET_CURRENCY: Record<Market, string> = {
  US: "USD",
  MY: "MYR",
  HK: "HKD",
  SG: "SGD",
};

export interface LedgerTrade {
  id: string;
  symbol: string;
  name?: string;
  market: Market;
  side: Side;
  quantity: number;
  price: number;
  currency: string;
  /** Trade currency -> MYR at trade date (BNM mid-rate). */
  fxRate: number;
  tradedAt: string;
  /** Total fees in the trade currency. */
  fees: number;
  note?: string;
}

/** One buy, with the part of it still open. */
export interface LedgerLot {
  tradeId: string;
  symbol: string;
  market: Market;
  openedAt: string;
  originalQty: number;
  remainingQty: number;
  costPrice: number;
  feesTotal: number;
  currency: string;
  fxRate: number;
}

/** One sell matched to one lot — the per-order profit record. */
export interface LedgerClosure {
  lotTradeId: string;
  sellTradeId: string;
  symbol: string;
  closedAt: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  feesLocal: number;
  grossPlLocal: number;
  netPlLocal: number;
  currency: string;
  totalPlBase: number;
  pricePlBase: number;
  fxPlBase: number;
  netPlBase: number;
}

export interface LedgerPosition {
  symbol: string;
  market: Market;
  currency: string;
  quantity: number;
  costTotal: number;
  averagePrice: number;
  averagePriceWithFees: number;
  costTotalBase: number;
  lots: LedgerLot[];
  closures: LedgerClosure[];
  realizedNetBase: number;
}

const KEY = "atlas.ledger.trades";
const EVENT = "atlas:ledger";
const r = (v: number, dp = 6) => Math.round(v * 10 ** dp) / 10 ** dp;

function read(): LedgerTrade[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LedgerTrade[]) : [];
  } catch {
    return [];
  }
}

/**
 * Rebuild lots, closures and positions from the immutable trade list.
 *
 * Deliberately a pure replay of every trade in time order rather than
 * incremental mutation: the book can always be reconstructed from its events,
 * so an edit or a late-arriving import can never leave stale derived state.
 */
export function derive(trades: LedgerTrade[]): LedgerPosition[] {
  const ordered = [...trades].sort((a, b) =>
    a.tradedAt === b.tradedAt ? a.id.localeCompare(b.id) : a.tradedAt < b.tradedAt ? -1 : 1,
  );

  const bySymbol = new Map<
    string,
    { market: Market; currency: string; lots: LedgerLot[]; closures: LedgerClosure[] }
  >();

  for (const t of ordered) {
    const key = `${t.market}:${t.symbol}`;
    if (!bySymbol.has(key)) {
      bySymbol.set(key, { market: t.market, currency: t.currency, lots: [], closures: [] });
    }
    const book = bySymbol.get(key)!;

    if (t.side === "buy") {
      book.lots.push({
        tradeId: t.id,
        symbol: t.symbol,
        market: t.market,
        openedAt: t.tradedAt,
        originalQty: t.quantity,
        remainingQty: t.quantity,
        costPrice: t.price,
        feesTotal: t.fees,
        currency: t.currency,
        fxRate: t.fxRate,
      });
      continue;
    }

    // Sell: consume open lots FIFO — same rule and same maths as the engine.
    let toFill = t.quantity;
    const open = book.lots
      .filter((l) => l.remainingQty > 0)
      .sort((a, b) => (a.openedAt < b.openedAt ? -1 : 1));

    for (const lot of open) {
      if (toFill <= 0) break;
      const qty = Math.min(lot.remainingQty, toFill);
      const buyFee = lot.originalQty > 0 ? (lot.feesTotal * qty) / lot.originalQty : 0;
      const sellFee = t.quantity > 0 ? (t.fees * qty) / t.quantity : 0;
      const feesLocal = r(buyFee + sellFee, 2);

      const grossPlLocal = r(qty * t.price - qty * lot.costPrice, 6);
      const totalPlBase = r(qty * t.price * t.fxRate - qty * lot.costPrice * lot.fxRate, 6);
      const pricePlBase = r(qty * (t.price - lot.costPrice) * lot.fxRate, 6);
      const fxPlBase = r(qty * t.price * (t.fxRate - lot.fxRate), 6);
      const feesBase = r(buyFee * lot.fxRate + sellFee * t.fxRate, 6);

      book.closures.push({
        lotTradeId: lot.tradeId,
        sellTradeId: t.id,
        symbol: t.symbol,
        closedAt: t.tradedAt,
        quantity: qty,
        costPrice: lot.costPrice,
        sellPrice: t.price,
        feesLocal,
        grossPlLocal,
        netPlLocal: r(grossPlLocal - feesLocal, 6),
        currency: t.currency,
        totalPlBase,
        pricePlBase,
        fxPlBase,
        netPlBase: r(totalPlBase - feesBase, 6),
      });

      lot.remainingQty = r(lot.remainingQty - qty, 6);
      toFill = r(toFill - qty, 6);
    }
  }

  return [...bySymbol.entries()]
    .map(([key, book]) => {
      const symbol = key.split(":")[1]!;
      const open = book.lots.filter((l) => l.remainingQty > 0);
      const quantity = r(open.reduce((a, l) => a + l.remainingQty, 0), 6);
      const costTotal = r(open.reduce((a, l) => a + l.remainingQty * l.costPrice, 0), 4);
      const feesOpen = open.reduce(
        (a, l) => a + (l.originalQty > 0 ? (l.feesTotal * l.remainingQty) / l.originalQty : 0),
        0,
      );
      const costTotalBase = r(
        open.reduce((a, l) => a + l.remainingQty * l.costPrice * l.fxRate, 0),
        4,
      );
      return {
        symbol,
        market: book.market,
        currency: book.currency,
        quantity,
        costTotal,
        averagePrice: quantity > 0 ? r(costTotal / quantity, 6) : 0,
        averagePriceWithFees: quantity > 0 ? r((costTotal + feesOpen) / quantity, 6) : 0,
        costTotalBase,
        lots: book.lots,
        closures: book.closures,
        realizedNetBase: r(book.closures.reduce((a, c) => a + c.netPlBase, 0), 4),
      };
    })
    .sort((a, b) => b.costTotalBase - a.costTotalBase);
}

export function useLedger() {
  const [trades, setTrades] = useState<LedgerTrade[]>([]);

  useEffect(() => {
    const sync = () => setTrades(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((next: LedgerTrade[]) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the entry simply does not persist */
    }
    setTrades(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const add = useCallback(
    (t: Omit<LedgerTrade, "id">) => {
      const id = `t${Date.now()}${Math.floor(Math.random() * 1000)}`;
      persist([...read(), { ...t, id }]);
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist(read().filter((t) => t.id !== id)),
    [persist],
  );

  return { trades, positions: derive(trades), add, remove };
}
