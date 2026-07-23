"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import type { Level, Risk } from "@/lib/mock/reports";

const RANK: Record<Level, number> = { Low: 1, Medium: 2, High: 3 };
const IMPACT_ROWS: Level[] = ["High", "Medium", "Low"]; // top → bottom
const LIKELIHOOD_COLS: Level[] = ["Low", "Medium", "High"]; // left → right

function cellTone(impact: Level, likelihood: Level): string {
  const score = RANK[impact] + RANK[likelihood];
  if (score >= 5) return "bg-negative/15";
  if (score === 4) return "bg-warning/15";
  return "bg-positive/10";
}

/**
 * Likelihood × impact risk matrix. Risks are plotted into cells; severity is
 * encoded in the cell tint (green → amber → red) so the board reads the risk
 * posture at a glance. A labelled list follows for detail.
 */
export function RiskMatrix({ risks }: { risks: Risk[] }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const lvl = (l: Level): string =>
    zh ? (l === "High" ? "高" : l === "Medium" ? "中" : "低") : l;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[32rem]">
          <div className="flex">
            <div className="w-24 shrink-0" />
            <div className="flex-1 pb-1 text-center font-mono text-2xs uppercase tracking-wide text-faint">
              {zh ? "可能性 →" : "Likelihood →"}
            </div>
          </div>
          <div className="flex">
            {/* impact axis label */}
            <div className="flex w-24 shrink-0 items-center justify-center">
              <span className="font-mono text-2xs uppercase tracking-wide text-faint [writing-mode:vertical-rl] rotate-180">
                {zh ? "影响 →" : "Impact →"}
              </span>
            </div>
            <div className="flex-1">
              {/* column headers */}
              <div className="grid grid-cols-3">
                {LIKELIHOOD_COLS.map((c) => (
                  <div
                    key={c}
                    className="px-2 pb-1 text-center font-mono text-2xs text-faint"
                  >
                    {lvl(c)}
                  </div>
                ))}
              </div>
              {/* rows */}
              {IMPACT_ROWS.map((rowImpact) => (
                <div key={rowImpact} className="grid grid-cols-3 gap-1 pb-1">
                  {LIKELIHOOD_COLS.map((colLike) => {
                    const inCell = risks.filter(
                      (r) => r.impact === rowImpact && r.likelihood === colLike,
                    );
                    return (
                      <div
                        key={colLike}
                        className={`min-h-[3.5rem] rounded border border-border p-1.5 ${cellTone(rowImpact, colLike)}`}
                      >
                        <span className="mb-1 block font-mono text-[9px] uppercase text-faint">
                          {rowImpact[0]}
                          {colLike[0]}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {inCell.map((r) => (
                            <span
                              key={r.title}
                              className="rounded bg-surface px-1.5 py-0.5 text-[10px] leading-tight text-fg"
                            >
                              {r.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {risks.map((r) => (
          <li
            key={r.title}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-panel border border-border bg-surface px-4 py-2.5 text-sm"
          >
            <span className="font-medium text-fg">{r.title}</span>
            <span className="font-mono text-2xs text-faint">
              {zh
                ? `可能性：${lvl(r.likelihood)} · 影响：${lvl(r.impact)}`
                : `L: ${r.likelihood} · I: ${r.impact}`}
            </span>
            <span className="w-full text-xs text-muted sm:w-auto sm:flex-1">
              {r.note}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
