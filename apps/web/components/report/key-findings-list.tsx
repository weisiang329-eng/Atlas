"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import type { Finding, Impact } from "@/lib/mock/reports";

const IMPACT: Record<
  Impact,
  { tone: "positive" | "negative" | "warning" | "neutral"; en: string; zh: string }
> = {
  positive: { tone: "positive", en: "Positive", zh: "正面" },
  negative: { tone: "negative", en: "Risk", zh: "风险" },
  watch: { tone: "warning", en: "Watch", zh: "关注" },
  neutral: { tone: "neutral", en: "Neutral", zh: "中性" },
};

/** Numbered, impact-tagged findings — the scannable core of every report. */
export function KeyFindingsList({ findings }: { findings: Finding[] }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  return (
    <ol className="space-y-3">
      {findings.map((f, i) => (
        <li
          key={f.title}
          className="flex gap-3 rounded-panel border border-border bg-surface p-4"
        >
          <span className="num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-2xs text-faint">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-fg">{f.title}</h3>
              <Badge tone={IMPACT[f.impact].tone}>
                {zh ? IMPACT[f.impact].zh : IMPACT[f.impact].en}
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{f.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
