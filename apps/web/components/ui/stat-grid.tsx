import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/cn";

export interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

/**
 * The canonical KPI strip: a bordered, hairline-divided grid of stats. Extracted
 * so every workspace renders headline figures identically instead of hand-rolling
 * the same grid. Responsive: 2-up on mobile, `columns`-up from `sm`/`lg`.
 */
export function StatGrid({
  items,
  columns = 4,
}: {
  items: StatItem[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-panel border border-border bg-border shadow-panel",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {items.map((s) => (
        <div key={s.label} className="bg-surface p-4">
          <Stat label={s.label} value={s.value} hint={s.hint} />
        </div>
      ))}
    </div>
  );
}
