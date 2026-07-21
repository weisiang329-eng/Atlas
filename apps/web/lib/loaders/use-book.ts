"use client";

/**
 * The trade book, served by the API (docs/PORTFOLIO-ACCOUNTING.md).
 *
 * Replaces the localStorage ledger. That was fine for a prototype but wrong for
 * a book of record: it lived in one browser, so trades entered on a laptop were
 * invisible on a phone and a cleared cache lost the lot. It is also the
 * prerequisite for the Moomoo sync, which writes to the database, not to
 * anyone's browser.
 *
 * All accounting happens server-side. This hook fetches and posts; it never
 * computes a figure — the same rule the rest of Atlas follows.
 */
import { useCallback, useEffect, useState } from "react";
import { apiFetch, isApiConfigured } from "@/lib/api/client";

export type Market = "US" | "MY" | "HK" | "SG";
export type Side = "buy" | "sell";

export const MARKET_CURRENCY: Record<Market, string> = {
  US: "USD",
  MY: "MYR",
  HK: "HKD",
  SG: "SGD",
};

export interface BookTrade {
  id: number;
  instrumentId: string;
  side: Side;
  quantity: number;
  price: number;
  currency: string;
  fxRate: number;
  tradedAt: string;
  note: string | null;
}

export interface BookLot {
  id: number;
  tradeId: number;
  openedAt: string;
  originalQty: number;
  remainingQty: number;
  costPrice: number;
  feesTotal: number;
  currency: string;
  fxRate: number;
}

export interface BookClosure {
  id: number;
  lotId: number;
  sellTradeId: number;
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

export interface BookPosition {
  instrumentId: string;
  symbol: string;
  market: Market;
  name: string;
  currency: string;
  quantity: number;
  costTotal: number;
  averagePrice: number;
  averagePriceWithFees: number;
  costTotalBase: number;
  openLots: number;
  realizedNetBase: number;
  lots: BookLot[];
  closures: BookClosure[];
}

export interface Book {
  baseCurrency: string;
  trades: BookTrade[];
  positions: BookPosition[];
  summary: {
    openPositions: number;
    tradeCount: number;
    costBasisBase: number;
    realizedNetBase: number;
    totalFeesBase: number;
  };
}

export interface NewTrade {
  symbol: string;
  name?: string;
  market: Market;
  side: Side;
  quantity: number;
  price: number;
  fxRate: number;
  tradedAt: string;
  /** Omit to let the server estimate from the market fee schedule. */
  fees?: number;
  note?: string;
}

const EMPTY: Book = {
  baseCurrency: "MYR",
  trades: [],
  positions: [],
  summary: {
    openPositions: 0,
    tradeCount: 0,
    costBasisBase: 0,
    realizedNetBase: 0,
    totalFeesBase: 0,
  },
};

export function useBook() {
  const live = isApiConfigured();
  const [book, setBook] = useState<Book>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    live ? "loading" : "ready",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) {
      setStatus("ready");
      return;
    }
    try {
      const data = await apiFetch<Book>("/v1/pms/book");
      setBook(data);
      setStatus("ready");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not load the book.");
    }
  }, [live]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (t: NewTrade) => {
      if (!live) return;
      await apiFetch("/v1/pms/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(t),
      });
      // The server replays the whole book on every write, so refetching is the
      // only way to stay consistent with it — never patch local state.
      await load();
    },
    [live, load],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!live) return;
      await apiFetch(`/v1/pms/trades/${id}`, { method: "DELETE" });
      await load();
    },
    [live, load],
  );

  return { book, status, error, add, remove, reload: load, live };
}
