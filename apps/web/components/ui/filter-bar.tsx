"use client";

import type { ReactNode } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/cn";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  active?: string;
  onFilter?: (value: string) => void;
  /** Slot rendered at the far right (e.g. a result count). */
  right?: ReactNode;
}

/**
 * Reusable list/table control row: a search field plus an optional segmented
 * filter. Controlled — the parent owns state and applies it. One filter UI for
 * every workspace list.
 */
export function FilterBar({
  search,
  onSearch,
  placeholder,
  filters,
  active,
  onFilter,
  right,
}: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder={placeholder ?? "Search"}
        className="w-full sm:w-64"
      />
      {filters && filters.length > 0 ? (
        <div
          className="flex rounded border border-border-soft bg-surface-3 p-0.5"
          role="group"
          aria-label="Filter"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilter?.(f.value)}
              aria-pressed={active === f.value}
              className={cn(
                "rounded px-2.5 py-1 font-mono text-2xs uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                active === f.value
                  ? "bg-surface-2 text-fg"
                  : "text-faint hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}
      {right ? (
        <div className="ml-auto font-mono text-2xs text-faint">{right}</div>
      ) : null}
    </div>
  );
}
