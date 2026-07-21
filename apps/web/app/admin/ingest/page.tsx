"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { INGEST_PIPELINES, type IngestPipeline } from "@/lib/mock/ops";

const cols: Column<IngestPipeline>[] = [
  { key: "kind", header: "管道", sortable: true },
  { key: "schedule", header: "调度", className: "font-mono text-2xs text-muted" },
  { key: "rows", header: "写入行数", numeric: true, sortable: true, sortAccessor: (p) => p.rows, render: (p) => <span className="num">{p.rows}</span> },
  { key: "lastRun", header: "上次运行", render: (p) => <span className="text-2xs text-faint">{formatRelative(p.lastRun)}</span> },
  { key: "ok", header: "状态", render: (p) => <Badge tone={p.ok ? "positive" : "negative"}>{p.ok ? "正常" : "失败"}</Badge> },
];

export default function IngestPage() {
  return (
    <WorkspaceLayout title="Ingest" eyebrow="P022 · Continuous Research" description="季度 YTD-diff、IFRS 映射、新闻/公告与 Cron 全自动摄取的运行监控。">
      <SectionHeading title="摄取管道" description="每个数值可回查原文；失败管道红色高亮，可重跑。" />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable columns={cols} rows={INGEST_PIPELINES} getRowId={(p) => p.id} caption="Ingest pipelines" />
      </div>
    </WorkspaceLayout>
  );
}
