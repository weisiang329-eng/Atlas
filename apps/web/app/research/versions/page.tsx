import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { formatDateTime } from "@/lib/format";
import { SAMPLE_VERSIONS, type SampleVersionRow } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Versions" };

const cols: Column<SampleVersionRow>[] = [
  { key: "doc", header: "文档", sortable: true },
  { key: "version", header: "版本", className: "font-mono text-2xs" },
  { key: "author", header: "作者", className: "font-mono text-2xs text-muted" },
  { key: "at", header: "时间", sortable: true, sortAccessor: (v) => v.at, render: (v) => <span className="text-2xs text-faint">{formatDateTime(v.at)}</span> },
];

export default function ResearchVersionsPage() {
  return (
    <>
      <SectionHeading title="版本历史" description="研究与报告的版本留痕，历史永不删除（审计与复盘依据，sample data）。" />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable columns={cols} rows={SAMPLE_VERSIONS} getRowId={(v) => v.id} caption="Version history" />
      </div>
    </>
  );
}
