"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import type { ReportModel } from "@/lib/mock/reports";
import { ReportHeader } from "@/components/report/report-header";
import { ExportToolbar } from "@/components/report/export-toolbar";
import { ReportSection, ReportList } from "@/components/report/report-section";
import { ExecutiveSummaryCard } from "@/components/report/executive-summary-card";
import { KeyFindingsList } from "@/components/report/key-findings-list";
import { EvidenceTable } from "@/components/report/evidence-table";
import { SourceList } from "@/components/report/source-list";
import { RiskMatrix } from "@/components/report/risk-matrix";
import { RecommendationBlock } from "@/components/report/recommendation-block";
import { DecisionMemoSection } from "@/components/report/decision-memo-section";
import { AppendixSection } from "@/components/report/appendix-section";
import { VersionHistoryPanel } from "@/components/report/version-history-panel";

const SECTION_LABELS: Record<string, { en: string; zh: string }> = {
  "executive-summary": { en: "Executive Summary", zh: "执行摘要" },
  "key-findings": { en: "Key Findings", zh: "关键发现" },
  evidence: { en: "Evidence", zh: "证据" },
  sources: { en: "Sources", zh: "来源" },
  risks: { en: "Risks", zh: "风险" },
  opportunities: { en: "Opportunities", zh: "机会" },
  assumptions: { en: "Assumptions", zh: "假设" },
  "open-questions": { en: "Open Questions", zh: "待解问题" },
  recommendations: { en: "Recommendations", zh: "建议" },
  "decision-log": { en: "Decision Log", zh: "决策日志" },
  appendix: { en: "Appendix", zh: "附录" },
  "version-history": { en: "Version History", zh: "版本历史" },
};

const TOC_IDS = Object.keys(SECTION_LABELS);

/**
 * Composition root for an Atlas report. Renders the full decision document from
 * a ReportModel in canonical section order, using the reusable report
 * components, plus a sticky table of contents. Server-rendered and print-ready;
 * the only client island is the ExportToolbar.
 */
export function ReportLayout({ report }: { report: ReportModel }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const label = (id: string): string => {
    const entry = SECTION_LABELS[id];
    return entry ? (zh ? entry.zh : entry.en) : id;
  };
  return (
    <div>
      <ExportToolbar report={report} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_13rem]">
        <article className="max-w-3xl">
          <ReportHeader report={report} />

          <div className="space-y-7">
            <ReportSection id="executive-summary" title={label("executive-summary")}>
              <ExecutiveSummaryCard
                summary={report.summary}
                lens={report.lens}
              />
            </ReportSection>

            <ReportSection id="key-findings" title={label("key-findings")}>
              <KeyFindingsList findings={report.keyFindings} />
            </ReportSection>

            <ReportSection id="evidence" title={label("evidence")}>
              <EvidenceTable items={report.evidence} />
            </ReportSection>

            <ReportSection id="sources" title={label("sources")}>
              <SourceList sources={report.sources} />
            </ReportSection>

            <ReportSection id="risks" title={label("risks")}>
              <RiskMatrix risks={report.risks} />
            </ReportSection>

            <ReportSection id="opportunities" title={label("opportunities")}>
              <ReportList
                items={report.opportunities.map(
                  (o) => `${o.title} — ${o.detail}`,
                )}
              />
            </ReportSection>

            <ReportSection id="assumptions" title={label("assumptions")}>
              <ReportList items={report.assumptions} />
            </ReportSection>

            <ReportSection id="open-questions" title={label("open-questions")}>
              <ReportList items={report.openQuestions} />
            </ReportSection>

            <ReportSection id="recommendations" title={label("recommendations")}>
              <RecommendationBlock recommendations={report.recommendations} />
            </ReportSection>

            <ReportSection id="decision-log" title={label("decision-log")}>
              <DecisionMemoSection entries={report.decisionLog} />
            </ReportSection>

            <ReportSection id="appendix" title={label("appendix")}>
              <AppendixSection items={report.appendix} />
            </ReportSection>

            <ReportSection id="version-history" title={label("version-history")}>
              <VersionHistoryPanel entries={report.versionHistory} />
            </ReportSection>
          </div>
        </article>

        <aside className="hidden xl:block print:hidden">
          <nav
            aria-label={zh ? "报告目录" : "Report contents"}
            className="sticky top-20 border-l border-border pl-4"
          >
            <p className="eyebrow mb-3">{zh ? "目录" : "Contents"}</p>
            <ul className="space-y-1.5">
              {TOC_IDS.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block text-xs text-muted transition-colors hover:text-fg"
                  >
                    {label(id)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
