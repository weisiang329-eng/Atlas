import { cn } from "@/lib/cn";

/**
 * Base shimmer block — VISUAL REFRESH v0.2: uses the `.skeleton` sweep
 * (globals.css) instead of opacity pulse; honours prefers-reduced-motion via
 * the global rule (falls back to a static block).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} />;
}

/** Generic block loading state for a panel or section. */
export function LoadingState({ label }: { label?: string }) {
  return (
    <div
      className="flex flex-col gap-3 p-1"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

/** Table-shaped skeleton — header row plus body rows. */
export function TableSkeleton({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div role="status" aria-busy="true" className="w-full">
      <div className="flex gap-4 border-b border-border px-3 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-3 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table</span>
    </div>
  );
}

/** KPI-strip skeleton matching StatGrid. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 bg-surface p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/** Chart-shaped skeleton. */
export function ChartSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div role="status" aria-busy="true" className="w-full">
      <div className="skeleton w-full rounded" style={{ height }} />
      <span className="sr-only">Loading chart</span>
    </div>
  );
}
