"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { AUTOMATION_JOBS, type AutomationJob } from "@/lib/mock/ops";

const cols: Column<AutomationJob>[] = [
  { key: "module", header: "任务 / 模块", sortable: true },
  { key: "schedule", header: "调度", className: "font-mono text-2xs text-muted" },
  { key: "lastRun", header: "上次运行", render: (j) => <span className="text-2xs text-faint">{formatRelative(j.lastRun)}</span> },
  { key: "lastOk", header: "状态", render: (j) => <Badge tone={j.lastOk ? "positive" : "negative"}>{j.lastOk ? "正常" : "失败"}</Badge> },
];

export default function AutomationPage() {
  const failing = AUTOMATION_JOBS.filter((j) => !j.lastOk).length;
  return (
    <WorkspaceLayout title="Automation" eyebrow="P024 · Automation Engine" description="全平台定时任务的统一调度视图与数据质量巡检。交易自动化不在此——见 P028 铁律。">
      <SectionHeading title="调度总览" description={failing === 0 ? "所有系统正常" : `${failing} 个任务失败，需处理`} />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable
        mobileCards columns={cols} rows={AUTOMATION_JOBS} getRowId={(j) => j.id} caption="Automation jobs" />
      </div>
    </WorkspaceLayout>
  );
}
