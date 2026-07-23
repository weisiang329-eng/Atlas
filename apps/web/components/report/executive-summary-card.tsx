"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import type { DecisionLens } from "@/lib/mock/reports";

/**
 * Executive summary framed around the five decision questions Atlas reports must
 * answer: what changed, why, who is affected, the evidence, and the next
 * decision. The lens is what makes this a decision document, not a summary.
 */
export function ExecutiveSummaryCard({
  summary,
  lens,
}: {
  summary: string;
  lens: DecisionLens;
}) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const items: { label: string; value: string; highlight?: boolean }[] = [
    { label: zh ? "有何变化" : "What changed", value: lens.changed },
    { label: zh ? "为何" : "Why", value: lens.why },
    { label: zh ? "影响对象" : "Who is affected", value: lens.affected },
    { label: zh ? "证据" : "Evidence", value: lens.evidence },
    { label: zh ? "下一步决策" : "Next decision", value: lens.next, highlight: true },
  ];

  return (
    <div className="rounded-panel border border-accent-dim/60 bg-surface p-5 shadow-panel">
      <p className="text-sm leading-relaxed text-fg">{summary}</p>
      <div className="mt-5 grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
        {items.map((it) => (
          <div
            key={it.label}
            className={`bg-surface p-3 ${it.highlight ? "sm:col-span-2" : ""}`}
          >
            <p
              className={`eyebrow mb-1 ${it.highlight ? "text-accent" : ""}`}
            >
              {it.label}
            </p>
            <p className="text-sm leading-relaxed text-muted">{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
