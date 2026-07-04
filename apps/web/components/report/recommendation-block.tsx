import { Badge } from "@/components/ui/badge";
import type { Level, Recommendation } from "@/lib/mock/reports";

const PRIORITY: Record<Level, "warning" | "info" | "neutral"> = {
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

/** Recommendations — the "what to do next" of the report, with owner and priority. */
export function RecommendationBlock({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  return (
    <div className="space-y-3">
      {recommendations.map((r, i) => (
        <div
          key={i}
          className="rounded-panel border border-border border-l-2 border-l-accent bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">{r.action}</h3>
            <Badge tone={PRIORITY[r.priority]}>{r.priority} priority</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {r.rationale}
          </p>
          <p className="mt-2 font-mono text-2xs text-faint">Owner: {r.owner}</p>
        </div>
      ))}
    </div>
  );
}
