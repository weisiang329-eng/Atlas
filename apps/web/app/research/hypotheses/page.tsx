"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_HYPOTHESES, type SampleHypothesisRow } from "@/lib/mock/research";


const TONE = { open: "info", supported: "positive", refuted: "negative" } as const;
const LABEL = { open: "待验证", supported: "已支持", refuted: "已证伪" } as const;

const cols: Column<SampleHypothesisRow>[] = [
  { key: "statement", header: "假设 Hypothesis", sortable: true, render: (h) => <span className="text-sm text-fg">{h.statement}</span> },
  { key: "decision", header: "关联决策", className: "text-muted" },
  { key: "status", header: "状态", render: (h) => <Badge tone={TONE[h.status]}>{LABEL[h.status]}</Badge> },
];

export default function ResearchHypothesesPage() {
  return (
    <>
      <SectionHeading title="假设追踪" description="每个判断背后的可验证假设，与决策日志（P008）联动，到期比对实际（P023，sample data）。" />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable columns={cols} rows={SAMPLE_HYPOTHESES} getRowId={(h) => h.id} caption="Hypotheses" />
      </div>
    </>
  );
}
