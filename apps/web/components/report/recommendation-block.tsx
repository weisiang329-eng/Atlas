"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
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
  const { locale } = useLocale();
  const zh = locale === "zh";
  const lvl = (l: Level): string =>
    zh ? (l === "High" ? "高" : l === "Medium" ? "中" : "低") : l;
  return (
    <div className="space-y-3">
      {recommendations.map((r, i) => (
        <div
          key={i}
          className="rounded-panel border border-border border-l-2 border-l-accent bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">{r.action}</h3>
            <Badge tone={PRIORITY[r.priority]}>
              {zh ? `${lvl(r.priority)}优先级` : `${r.priority} priority`}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {r.rationale}
          </p>
          <p className="mt-2 font-mono text-2xs text-faint">
            {zh ? "负责人：" : "Owner: "}
            {r.owner}
          </p>
        </div>
      ))}
    </div>
  );
}
