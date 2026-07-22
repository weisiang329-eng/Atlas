import { cn } from "@/lib/cn";
import type { FactorScore } from "@/lib/mock/scores";

/** Shared thresholds so the bar and the cell can never disagree on colour. */
function toneOfScore(score: number): string {
  return score >= 66 ? "bg-positive" : score >= 40 ? "bg-warning" : "bg-negative";
}

/** Horizontal factor score bar (0-100) — labelled, for detail views. */
export function FactorBar({ factor }: { factor: FactorScore }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-2xs text-faint">{factor.label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn("h-full rounded-full", toneOfScore(factor.score))}
          style={{ width: `${factor.score}%` }}
        />
      </div>
      <span className="num w-7 shrink-0 text-right text-2xs text-muted">
        {factor.score}
      </span>
    </div>
  );
}

/**
 * The same bar sized for a dense table cell: no label (the column header
 * carries it) and the figure inline.
 *
 * A bare number tells you a factor is 81; a bar tells you it is 81 *out of
 * 100* without the reader converting anything, and a column of bars shows the
 * shape of a company's profile at a glance. That is the whole reason the
 * design uses bars here.
 */
export function FactorCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-faint">—</span>;
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className="hidden h-1 w-10 overflow-hidden rounded-full bg-surface-3 sm:block">
        <div
          className={cn("h-full rounded-full", toneOfScore(score))}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      <span className="num w-6 shrink-0 text-right">{score}</span>
    </div>
  );
}
