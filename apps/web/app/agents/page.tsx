"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { AGENT_TASKS, type AgentTask } from "@/lib/mock/ops";

const TONE = { queued: "neutral", running: "info", done: "positive", failed: "negative" } as const;
const LABEL = { queued: "排队", running: "运行中", done: "完成", failed: "失败" } as const;

const cols: Column<AgentTask>[] = [
  { key: "kind", header: "任务", sortable: true },
  { key: "status", header: "状态", render: (t) => <Badge tone={TONE[t.status]}>{LABEL[t.status]}</Badge> },
  { key: "tokens", header: "Tokens", numeric: true, sortable: true, sortAccessor: (t) => t.tokens, render: (t) => <span className="num">{t.tokens.toLocaleString("en-US")}</span> },
  { key: "ms", header: "耗时", numeric: true, sortable: true, sortAccessor: (t) => t.ms, render: (t) => <span className="num">{(t.ms / 1000).toFixed(1)}s</span> },
  { key: "createdAt", header: "创建", render: (t) => <span className="text-2xs text-faint">{formatRelative(t.createdAt)}</span> },
];

export default function AgentsPage() {
  return (
    <WorkspaceLayout title="Agents" eyebrow="P020 · Agent Runtime" description="研究任务 → 工具调用 → 产出。产出永远是草稿，人审后才成为事实（硬门禁）。">
      <SectionHeading title="任务运行台" description="只读工具集起步；越权工具调用被拒并记日志。" />
      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable columns={cols} rows={AGENT_TASKS} getRowId={(t) => t.id} caption="Agent tasks" />
      </div>
    </WorkspaceLayout>
  );
}
