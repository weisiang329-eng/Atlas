"use client";

/**
 * The Book 2 knowledge scorecard, rendered.
 *
 * The manual's discipline is that every industry carries the same twenty
 * sections, so "what do we not know" is computed rather than judged. This panel
 * is the visible half of that: it leads with the GAPS, because an industry at
 * 25% tells the analyst exactly what to research next, while a page showing
 * only what it has would hide that.
 */
import { ChartContainer } from "@/components/chart/chart-container";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/use-locale";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

interface SectionStatus {
  section: string;
  labelEn: string;
  labelZh: string;
  recordCount: number;
  filled: boolean;
  sourced: boolean;
  assumptions: number;
}

interface KnowledgeResponse {
  completeness: {
    sections: SectionStatus[];
    completenessPct: number;
    attributionPct: number;
    filledCount: number;
    totalSections: number;
  };
  sections: Record<
    string,
    { content: string; kind: string; sourceUrl: string | null; confidence: number }[]
  >;
  kpis: {
    id: number;
    key: string;
    name: string;
    definition: string;
    whyItMatters: string;
    unit: string | null;
    signalType: "leading" | "lagging";
    updateFrequency: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
  }[];
}

export function IndustryKnowledgePanel({ industryId }: { industryId: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const live = isApiConfigured();
  const r = useApiResource<KnowledgeResponse>(
    live ? `/v1/industries/${industryId}/knowledge` : null,
  );

  const c = r.data?.completeness;
  const kpis = r.data?.kpis ?? [];
  const sections = r.data?.sections ?? {};

  return (
    <DataState status={r.status}>
      {c ? (
        <div className="flex flex-col gap-6">
          <ChartContainer
            title={zh ? "知识完整度" : "Knowledge completeness"}
            subtitle={
              zh
                ? "Book 2 规定的 20 个章节 — 缺口是工作清单，不是遮羞布"
                : "The twenty mandated sections — gaps are the work list, not something to hide"
            }
            actions={
              <div className="flex items-center gap-3">
                <span className="num text-sm text-fg">
                  {c.completenessPct}%
                </span>
                <span className="text-2xs text-faint">
                  {c.filledCount}/{c.totalSections}
                </span>
              </div>
            }
          >
            {/* A twenty-cell strip: filled, unsourced, or a genuine gap. */}
            <div className="mb-4 grid grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-10">
              {c.sections.map((s) => (
                <div
                  key={s.section}
                  title={`${zh ? s.labelZh : s.labelEn}${
                    s.filled
                      ? ` · ${s.recordCount} ${zh ? "条" : "record(s)"}${
                          s.sourced ? "" : zh ? " · 无来源" : " · unsourced"
                        }`
                      : zh
                        ? " · 未研究"
                        : " · not researched"
                  }`}
                  className={cn(
                    "flex flex-col gap-1 rounded border px-2 py-1.5 transition-colors",
                    s.filled
                      ? s.sourced
                        ? "border-positive/30 bg-positive/10"
                        : "border-warning/30 bg-warning/10"
                      : "border-border-soft bg-surface-3",
                  )}
                >
                  <span
                    className={cn(
                      "truncate text-[10px] leading-tight",
                      s.filled ? "text-fg" : "text-faint",
                    )}
                  >
                    {zh ? s.labelZh : s.labelEn}
                  </span>
                  <span className="num text-[10px] text-faint">
                    {s.filled ? s.recordCount : "—"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-2xs text-muted">
              <span>
                {zh ? "来源标注" : "Source attribution"}{" "}
                <span className="num text-fg">{c.attributionPct}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm border border-positive/30 bg-positive/10" />
                {zh ? "已研究且有来源" : "researched, sourced"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm border border-warning/30 bg-warning/10" />
                {zh ? "已研究但无来源" : "researched, unsourced"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm border border-border-soft bg-surface-3" />
                {zh ? "未研究" : "not researched"}
              </span>
            </div>
          </ChartContainer>

          {kpis.length > 0 ? (
            <ChartContainer
              title={zh ? "行业 KPI" : "Industry KPIs"}
              subtitle={
                zh
                  ? "行业独有的运营驱动因子 — 通用财务比率不算"
                  : "Operational drivers specific to this industry — never a generic financial ratio"
              }
            >
              <ul className="flex flex-col gap-3">
                {kpis.map((k) => (
                  <li
                    key={k.id}
                    className="rounded border border-border-soft bg-surface-3 p-3"
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-fg">{k.name}</span>
                      {k.unit ? (
                        <span className="num text-2xs text-faint">{k.unit}</span>
                      ) : null}
                      <Badge
                        tone={k.signalType === "leading" ? "accent" : "neutral"}
                      >
                        {k.signalType === "leading"
                          ? zh ? "领先" : "leading"
                          : zh ? "滞后" : "lagging"}
                      </Badge>
                      {k.updateFrequency ? (
                        <span className="text-2xs text-faint">
                          {k.updateFrequency}
                        </span>
                      ) : null}
                    </div>
                    <p className="mb-1 text-2xs leading-relaxed text-muted">
                      {k.definition}
                    </p>
                    {/* "Why it matters" is a mandated field, and the one that
                        turns a number into knowledge someone can act on. */}
                    <p className="text-2xs leading-relaxed text-fg-muted">
                      <span className="text-faint">
                        {zh ? "为什么重要：" : "Why it matters: "}
                      </span>
                      {k.whyItMatters}
                    </p>
                    {k.sourceName ? (
                      <p className="mt-1.5 text-2xs text-faint">
                        {zh ? "来源" : "Source"}:{" "}
                        {k.sourceUrl ? (
                          <a
                            href={k.sourceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-accent hover:underline"
                          >
                            {k.sourceName} ↗
                          </a>
                        ) : (
                          k.sourceName
                        )}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ChartContainer>
          ) : null}

          {c.sections.some((s) => s.filled) ? (
            <ChartContainer
              title={zh ? "已研究内容" : "Researched"}
              subtitle={`${fmtNumber(c.filledCount)} ${zh ? "个章节" : "sections"}`}
            >
              <div className="flex flex-col gap-4">
                {c.sections
                  .filter((s) => s.filled)
                  .map((s) => (
                    <div key={s.section}>
                      <p className="eyebrow mb-1.5">
                        {zh ? s.labelZh : s.labelEn}
                      </p>
                      {(sections[s.section] ?? []).map((rec, i) => (
                        <div key={i} className="mb-2">
                          <p className="text-2xs leading-relaxed text-muted">
                            {rec.content}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                            {rec.kind === "assumption" ? (
                              <Badge tone="warning">
                                {zh ? "假设" : "assumption"}
                              </Badge>
                            ) : null}
                            {rec.sourceUrl ? (
                              <a
                                href={rec.sourceUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-accent hover:underline"
                              >
                                {zh ? "来源" : "source"} ↗
                              </a>
                            ) : (
                              <span className="text-warning">
                                {zh ? "无来源标注" : "no source"}
                              </span>
                            )}
                            <span className="num">
                              {zh ? "置信度" : "confidence"}{" "}
                              {Math.round(rec.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </ChartContainer>
          ) : null}
        </div>
      ) : null}
    </DataState>
  );
}
