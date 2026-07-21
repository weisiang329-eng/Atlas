"use client";

import { useWatchlist } from "@/lib/loaders/use-watchlist";

/** The ☆/★ toggle in the company header. Persists to the local watchlist. */
export function WatchlistButton({ companyId }: { companyId: string }) {
  const { has, toggle } = useWatchlist();
  const on = has(companyId);
  return (
    <button
      type="button"
      onClick={() => toggle(companyId)}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded border px-3 py-2 text-sm transition-colors ${
        on
          ? "border-accent-dim bg-surface-2 text-accent"
          : "border-border bg-surface text-muted hover:text-fg"
      }`}
    >
      <span aria-hidden>{on ? "★" : "☆"}</span>
      {on ? "Watching" : "Watchlist"}
    </button>
  );
}
