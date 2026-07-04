"use client";

import { useState } from "react";
import { DataState, type ResourceStatus } from "@/components/ui/data-state";
import { TableSkeleton } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

const STATES: ResourceStatus[] = ["ready", "loading", "empty", "error"];

/**
 * Live demonstration that the async-state system (DataState + loading / empty /
 * error) is wired and reusable. This is the same boundary real data will flow
 * through — here it is driven by a manual toggle instead of a request.
 */
export function StateShowcase() {
  const [status, setStatus] = useState<ResourceStatus>("ready");

  return (
    <section className="rounded-panel border border-border bg-surface shadow-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="eyebrow mb-1">Design system</p>
          <h3 className="font-sans text-sm font-semibold text-fg">
            Async states — preview
          </h3>
        </div>
        <div
          className="flex rounded border border-border bg-bg p-0.5"
          role="tablist"
          aria-label="Preview state"
        >
          {STATES.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded px-2.5 py-1 font-mono text-2xs uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                status === s
                  ? "bg-surface-2 text-fg"
                  : "text-faint hover:text-fg",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </header>
      <div className="p-4">
        <DataState
          status={status}
          loading={<TableSkeleton rows={4} cols={3} />}
          error={
            <ErrorState
              message="This section could not be loaded. Please try again."
              onRetry={() => setStatus("ready")}
            />
          }
          empty={
            <EmptyState
              title="No results"
              body="Nothing matches the current view."
            />
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {["Revenue", "Operating income", "Net income"].map((k, i) => (
              <div
                key={k}
                className="rounded border border-border bg-bg p-3"
              >
                <p className="eyebrow mb-1">{k}</p>
                <p className="font-mono text-lg tabular-nums text-fg">
                  {["21,000", "8,250", "6,910"][i]}
                </p>
              </div>
            ))}
          </div>
        </DataState>
      </div>
    </section>
  );
}
