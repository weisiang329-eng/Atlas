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

const TOC: { id: string; label: string }[] = [
  { id: "executive-summary", label: "Executive Summary" },
  { id: "key-findings", label: "Key Findings" },
  { id: "evidence", label: "Evidence" },
  { id: "sources", label: "Sources" },
  { id: "risks", label: "Risks" },
  { id: "opportunities", label: "Opportunities" },
  { id: "assumptions", label: "Assumptions" },
  { id: "open-questions", label: "Open Questions" },
  { id: "recommendations", label: "Recommendations" },
  { id: "decision-log", label: "Decision Log" },
  { id: "appendix", label: "Appendix" },
  { id: "version-history", label: "Version History" },
];

/**
 * Composition root for an Atlas report. Renders the full decision document from
 * a ReportModel in canonical section order, using the reusable report
 * components, plus a sticky table of contents. Server-rendered and print-ready;
 * the only client island is the ExportToolbar.
 */
export function ReportLayout({ report }: { report: ReportModel }) {
  return (
    <div>
      <ExportToolbar report={report} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_13rem]">
        <article className="max-w-3xl">
          <ReportHeader report={report} />

          <div className="space-y-7">
            <ReportSection id="executive-summary" title="Executive Summary">
              <ExecutiveSummaryCard
                summary={report.summary}
                lens={report.lens}
              />
            </ReportSection>

            <ReportSection id="key-findings" title="Key Findings">
              <KeyFindingsList findings={report.keyFindings} />
            </ReportSection>

            <ReportSection id="evidence" title="Evidence">
              <EvidenceTable items={report.evidence} />
            </ReportSection>

            <ReportSection id="sources" title="Sources">
              <SourceList sources={report.sources} />
            </ReportSection>

            <ReportSection id="risks" title="Risks">
              <RiskMatrix risks={report.risks} />
            </ReportSection>

            <ReportSection id="opportunities" title="Opportunities">
              <ReportList
                items={report.opportunities.map(
                  (o) => `${o.title} — ${o.detail}`,
                )}
              />
            </ReportSection>

            <ReportSection id="assumptions" title="Assumptions">
              <ReportList items={report.assumptions} />
            </ReportSection>

            <ReportSection id="open-questions" title="Open Questions">
              <ReportList items={report.openQuestions} />
            </ReportSection>

            <ReportSection id="recommendations" title="Recommendations">
              <RecommendationBlock recommendations={report.recommendations} />
            </ReportSection>

            <ReportSection id="decision-log" title="Decision Log">
              <DecisionMemoSection entries={report.decisionLog} />
            </ReportSection>

            <ReportSection id="appendix" title="Appendix">
              <AppendixSection items={report.appendix} />
            </ReportSection>

            <ReportSection id="version-history" title="Version History">
              <VersionHistoryPanel entries={report.versionHistory} />
            </ReportSection>
          </div>
        </article>

        <aside className="hidden xl:block print:hidden">
          <nav
            aria-label="Report contents"
            className="sticky top-20 border-l border-border pl-4"
          >
            <p className="eyebrow mb-3">Contents</p>
            <ul className="space-y-1.5">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="block text-xs text-muted transition-colors hover:text-fg"
                  >
                    {t.label}
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
