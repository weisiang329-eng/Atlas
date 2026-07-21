"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { LEARNING_STATS, type LearningStat } from "@/lib/mock/learning";

const cols: Column<LearningStat>[] = [
  { key: "dim", header: "维度", sortable: true },
  {
    key: "hitRate",
    header: "命中率",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.hitRate,
    render: (r) => <span className={`num ${r.hitRate >= 0.6 ? "text-positive" : "text-muted"}`}>{(r.hitRate * 100).toFixed(0)}%</span>,
  },
  {
    key: "n",
    header: "样本数",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.n,
    render: (r) => (
      <span className="num inline-flex items-center gap-1">
        {r.n}
        {r.n < 10 ? <Badge tone="warning">样本不足</Badge> : null}
      </span>
    ),
  },
];

export default function LearningPage() {
  return (
    <WorkspaceLayout title="Learning" eyebrow="P023 · Learning Engine" description="预测 vs 实际复盘（接 P008 决策日志），量化判断准确率，反哺评分模型迭代。">
      <SectionHeading title="判断准确率" description="小样本仅供参考（n<10 标注）；到期预测自动比对实际后人工确认。" />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable columns={cols} rows={LEARNING_STATS} getRowId={(r) => r.dim} caption="Learning stats" />
      </div>
    </WorkspaceLayout>
  );
}
