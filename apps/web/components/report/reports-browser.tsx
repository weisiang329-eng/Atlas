"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReportStatus, ReportTypeMeta } from "@/lib/mock/reports";

const STATUS_TONE: Record<ReportStatus, "neutral" | "warning" | "positive"> = {
  Draft: "neutral",
  "In review": "warning",
  Final: "positive",
};

const FILTERS: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "Draft" },
  { label: "Review", value: "In review" },
  { label: "Final", value: "Final" },
];

/** Client browser for the report library: FilterBar (search + status) over cards. */
export function ReportsBrowser({ items }: { items: ReportTypeMeta[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const matchesStatus = status === "all" || r.status === status;
      const matchesQuery =
        !q ||
        `${r.type} ${r.subject} ${r.summaryLine}`.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [items, query, status]);

  return (
    <>
      <FilterBar
        search={query}
        onSearch={setQuery}
        placeholder="Search reports"
        filters={FILTERS}
        active={status}
        onFilter={setStatus}
        right={`${filtered.length} / ${items.length}`}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching reports"
          body="Try a different search term or status filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="group flex h-full flex-col rounded-panel border border-border bg-surface p-5 shadow-panel transition-colors hover:border-accent-dim hover:bg-surface-2"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="eyebrow">{r.type}</span>
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              </div>
              <p className="text-sm font-medium text-fg">{r.subject}</p>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
                {r.summaryLine}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-2xs uppercase tracking-wide text-accent">
                Open report
                <span className="transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
