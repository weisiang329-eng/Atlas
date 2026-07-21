import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_EVIDENCE, type SampleEvidenceRow } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Evidence" };

const TONE = { high: "positive", med: "warning", low: "neutral" } as const;

const cols: Column<SampleEvidenceRow>[] = [
  { key: "claim", header: "论断 Claim", sortable: true, render: (e) => <span className="text-sm text-fg">{e.claim}</span> },
  { key: "source", header: "来源 Source", className: "text-muted" },
  { key: "confidence", header: "置信度", render: (e) => <Badge tone={TONE[e.confidence]}>{e.confidence}</Badge> },
];

export default function ResearchEvidencePage() {
  return (
    <>
      <SectionHeading title="证据表" description="每条论断 → 来源 → 置信度。这张表是可审计研究（含 AI 生成）的契约（sample data）。" />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable columns={cols} rows={SAMPLE_EVIDENCE} getRowId={(e) => e.id} searchable searchPlaceholder="Search claims…" caption="Evidence" />
      </div>
    </>
  );
}
