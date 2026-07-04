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
}

/**
 * A metric tile with an optional delta and inline trend. Richer than `Stat`:
 * use where a value's movement matters. Delta colour is semantic (up=positive),
 * separate from the accent.
 */
export function KpiCard({
  label,
  value,
  delta,
  direction = "flat",
  series,
  hint,
}: KpiCardProps) {
  const tone =
    direction === "up"
      ? "text-positive"
      : direction === "down"
        ? "text-negative"
        : "text-muted";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";

  return (
    <div className="flex flex-col gap-1 rounded-panel border border-border bg-surface p-4 shadow-panel">
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {series && series.length > 1 ? (
          <Sparkline values={series} ariaLabel={`${label} trend`} />
        ) : null}
      </div>
      <span className="font-mono text-xl font-medium tabular-nums text-fg">
        {value}
      </span>
      <div className="flex items-center gap-2 text-xs">
        {delta ? (
          <span className={cn("inline-flex items-center gap-0.5 font-mono", tone)}>
            <span aria-hidden>{arrow}</span>
            {delta}
          </span>
        ) : null}
        {hint ? <span className="text-faint">{hint}</span> : null}
      </div>
    </div>
  );
}
