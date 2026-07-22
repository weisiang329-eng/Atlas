"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChartContainer } from "@/components/chart/chart-container";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { USERS, AUDIT_LOG, type UserRow, type AuditRow } from "@/lib/mock/admin";
import { SampleDataNotice } from "@/components/ui/sample-data-notice";

const ROLE_TONE = { owner: "accent", analyst: "info", viewer: "neutral" } as const;

const userCols: Column<UserRow>[] = [
  { key: "name", header: "用户", sortable: true, render: (u) => <div className="flex flex-col"><span className="text-sm text-fg">{u.name}</span><span className="text-2xs text-faint">{u.email}</span></div> },
  { key: "role", header: "角色", render: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge> },
  { key: "enabled", header: "状态", render: (u) => <Badge tone={u.enabled ? "positive" : "neutral"}>{u.enabled ? "启用" : "停用"}</Badge> },
];

const auditCols: Column<AuditRow>[] = [
  { key: "at", header: "时间", sortable: true, sortAccessor: (a) => a.at, render: (a) => <span className="num text-2xs text-faint">{formatDateTime(a.at)}</span> },
  { key: "actor", header: "操作者", className: "font-mono text-2xs" },
  { key: "action", header: "动作", className: "font-mono text-2xs text-fg" },
  { key: "entity", header: "对象", className: "text-muted" },
];

export default function AdminPage() {
  return (
    <WorkspaceLayout title="Admin" eyebrow="P025 · Atlas 1.0" description="用户与权限、审计日志、系统状态。组合/交易/ERP 默认仅 owner 可见（UI + API 双层校验）。">
      <SampleDataNotice reason="Real users, roles and audit rows arrive with multi-user auth (login option B); nothing is persisted yet." />
      <SectionHeading title="平台管理" description="权限双层校验、审计 append-only、每日 D1 备份至 R2。" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="用户与角色" subtitle="owner / analyst / viewer">
          <DataTable columnPickerId="admin-users"
        mobileCards columns={userCols} rows={USERS} getRowId={(u) => u.id} caption="Users" />
        </ChartContainer>
        <ChartContainer title="审计日志" subtitle="登录 / 写操作 / 导出（append-only）">
          <DataTable columns={auditCols} rows={AUDIT_LOG} getRowId={(a) => a.id} searchable searchPlaceholder="Search audit…" caption="Audit log" />
        </ChartContainer>
      </div>
    </WorkspaceLayout>
  );
}
