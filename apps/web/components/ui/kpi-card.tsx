import { Sparkline } from "@/components/chart/sparkline";
import { cn } from "@/lib/cn";

export type KpiDirection = "up" | "down" | "flat";

interface KpiCardProps {
  label: string;
  value: string;
  /** e.g. "+3 this week". Colour follows `direction`. */
  delta?: string;
  direction?: KpiDirection;
  series?: number[];
  hint?: string;
  /** Live-data flash class from usePriceFlash (e.g. "flash-up"). Optional. */
  flash?: string;
}

/**
 * A metric tile with an optional delta and inline trend.
 *
 * VISUAL REFRESH v0.2: the value uses the `.num` utility (Plex Sans +
 * tabular-nums — plain zero, per the numeric glyph rule) instead of Plex Mono;
 * the sparkline follows series direction; an optional `flash` class enables
 * live price pulses. API is backward-compatible.
 */
export function KpiCard({
  label,
  value,
  delta,
  direction = "flat",
  series,
  hint,
  flash,
}: KpiCardProps) {
  const tone =
    direction === "up"
      ? "text-positive"
      : direction === "down"
        ? "text-negative"
        : "text-muted";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-panel border border-border bg-surface p-4 shadow-panel transition-colors",
        flash,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {series && series.length > 1 ? (
          <Sparkline values={series} ariaLabel={`${label} trend`} />
        ) : null}
      </div>
      <span className="num text-xl font-semibold tabular-nums text-fg">
        {value}
      </span>
      <div className="flex items-center gap-2 text-xs">
        {delta ? (
          <span className={cn("num inline-flex items-center gap-0.5", tone)}>
            <span aria-hidden>{arrow}</span>
            {delta}
          </span>
        ) : null}
        {hint ? <span className="text-faint">{hint}</span> : null}
      </div>
    </div>
  );
}
