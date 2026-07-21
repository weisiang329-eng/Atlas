"use client";

/**
 * Research notes + decision journal (P008 v1) — the analyst's own record of
 * judgements and their reasons. Client-only in localStorage (personal,
 * offline, no auth), consistent with watchlist/portfolio; a D1-backed,
 * source-linked, versioned store is v2 once a write-auth model exists.
 *
 * Ids are derived from a monotonic counter + the stored set, not from
 * Date/random (which are unavailable in some runtimes) — the create call
 * stamps `createdAt` from the caller.
 */
import { useCallback, useEffect, useState } from "react";

export interface ResearchNote {
  id: string;
  title: string;
  body: string;
  companyId?: string;
  createdAt: string;
}

export interface Decision {
  id: string;
  decision: string;
  rationale: string;
  conviction: "low" | "medium" | "high";
  companyId?: string;
  date: string;
  outcome?: string;
}

const KEYS = { notes: "atlas.notes", decisions: "atlas.decisions" } as const;
const EVENT = "atlas:research";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function newId(existing: { id: string }[]): string {
  const max = existing.reduce((m, x) => {
    const n = Number(x.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `r${max + 1}`;
}

function useCollection<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    setItems(read<T>(key));
    const sync = () => setItems(read<T>(key));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);

  const add = useCallback(
    (item: Omit<T, "id">): string => {
      const current = read<T>(key);
      const id = newId(current);
      write<T>(key, [{ ...item, id } as T, ...current]);
      return id;
    },
    [key],
  );

  const remove = useCallback(
    (id: string) => write<T>(key, read<T>(key).filter((x) => x.id !== id)),
    [key],
  );

  return { items, add, remove };
}

export const useNotes = () => useCollection<ResearchNote>(KEYS.notes);
export const useDecisions = () => useCollection<Decision>(KEYS.decisions);
