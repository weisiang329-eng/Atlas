"use client";

/**
 * Portfolio holdings (P012) — client-only positions in localStorage, same
 * offline single-user model as the watchlist. A holding is a company id +
 * share count + average cost. No prices are stored: market value / P&L arrive
 * with market data (P027); v1 works on cost basis, which is honest and needs
 * no external feed.
 */
import { useCallback, useEffect, useState } from "react";

const KEY = "atlas.portfolio";
const EVENT = "atlas:portfolio";

export interface Holding {
  id: string;
  shares: number;
  avgCost: number;
}

function read(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Holding[]) : [];
    return parsed.filter((h) => h && typeof h.id === "string");
  } catch {
    return [];
  }
}

function write(holdings: Holding[]) {
  window.localStorage.setItem(KEY, JSON.stringify(holdings));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    setHoldings(read());
    const sync = () => setHoldings(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** Add or replace the holding for a company. */
  const upsert = useCallback((holding: Holding) => {
    const current = read().filter((h) => h.id !== holding.id);
    write([...current, holding]);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((h) => h.id !== id));
  }, []);

  return { holdings, upsert, remove };
}
