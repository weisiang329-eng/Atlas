import { Badge } from "@/components/ui/badge";
import type { Finding, Impact } from "@/lib/mock/reports";

const IMPACT: Record<
  Impact,
  { tone: "positive" | "negative" | "warning" | "neutral"; label: string }
> = {
  positive: { tone: "positive", label: "Positive" },
  negative: { tone: "negative", label: "Risk" },
  watch: { tone: "warning", label: "Watch" },
  neutral: { tone: "neutral", label: "Neutral" },
};

/** Numbered, impact-tagged findings — the scannable core of every report. */
export function KeyFindingsList({ findings }: { findings: Finding[] }) {
  return (
    <ol className="space-y-3">
      {findings.map((f, i) => (
        <li
          key={f.title}
          className="flex gap-3 rounded-panel border border-border bg-surface p-4"
        >
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border font-mono text-2xs text-faint">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-fg">{f.title}</h3>
              <Badge tone={IMPACT[f.impact].tone}>{IMPACT[f.impact].label}</Badge>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{f.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
