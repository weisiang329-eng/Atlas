import Link from "next/link";
import { cn } from "@/lib/cn";
import { MISSING } from "@/lib/format";

export interface RankedBar {
  label: string;
  value: number | null;
  /** Optional secondary figure shown to the right of the value. */
  hint?: string;
  href?: string;
}

/**
 * Ranked horizontal bars.
 *
 * `BarSeries` draws vertical bars with labels under the axis, which works for
 * short labels (Q1, FY24, Jan) and fails for category names: seven industries
 * rendered "AI AcceleratorSemiconductorData Center Po" — the labels collided
 * into one unreadable string. Turning the bars on their side gives each label
 * a whole line, so the names stay legible however long they get, and ranking
 * top-to-bottom is the natural reading order for a league table anyway.
 *
 * Values also sit at the end of each bar. A chart the reader cannot take a
 * number off is decoration.
 */
export function RankedBars({
  bars,
  max = 100,
  tone = "score",
  ariaLabel,
}: {
  bars: RankedBar[];
  /** Scale ceiling. Defaults to 100 for scores; pass a max for open scales. */
  max?: number;
  /** "score" colours by the shared Atlas thresholds; "accent" is monochrome. */
  tone?: "score" | "accent";
  ariaLabel: string;
}) {
  const ceiling = Math.max(max, ...bars.map((b) => b.value ?? 0)) || 1;

  return (
    <ul className="flex flex-col gap-2.5" aria-label={ariaLabel}>
      {bars.map((b) => {
        const v = b.value;
        const pct = v === null ? 0 : Math.max(0, Math.min(100, (v / ceiling) * 100));
        const fill =
          tone === "accent"
            ? "bg-accent"
            : v === null
              ? "bg-border-strong"
              : v >= 66
                ? "bg-positive"
                : v >= 40
                  ? "bg-warning"
                  : "bg-negative";

        const label = b.href ? (
          <Link href={b.href} className="truncate hover:text-accent">
            {b.label}
          </Link>
        ) : (
          <span className="truncate">{b.label}</span>
        );

        return (
          <li key={b.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-2xs text-muted sm:w-44">{label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
              <span
                className={cn("block h-full rounded-full transition-all", fill)}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="num w-8 shrink-0 text-right text-xs text-fg">
              {v === null ? MISSING : v}
            </span>
            {b.hint ? (
              <span className="num w-12 shrink-0 text-right text-2xs text-faint">{b.hint}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
