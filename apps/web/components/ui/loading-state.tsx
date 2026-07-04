import { cn } from "@/lib/cn";

/** Base shimmer block. Honours prefers-reduced-motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-surface-2 motion-reduce:animate-none",
        className,
      )}
    />
  );
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

/** Chart-shaped skeleton. */
export function ChartSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div role="status" aria-busy="true" className="w-full">
      <div
        className="w-full animate-pulse rounded bg-surface-2 motion-reduce:animate-none"
        style={{ height }}
      />
      <span className="sr-only">Loading chart</span>
    </div>
  );
}
