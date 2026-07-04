import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { Badge } from "@/components/ui/badge";
import { FINANCIAL_TABS } from "@/lib/nav";
import { FIN_SUBJECT } from "@/lib/mock/financials";

export default function FinancialsLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Financials"
      eyebrow="Financial workspace"
      description="Statements, metrics and results. Structure and components only — every figure is illustrative sample data."
      tabs={FINANCIAL_TABS}
      actions={
        <div className="flex items-center gap-2 rounded border border-border bg-surface px-3 py-2">
          <span className="text-2xs uppercase tracking-wide text-faint">
            Subject
          </span>
          <span className="text-sm font-medium text-fg">{FIN_SUBJECT.name}</span>
          <span className="font-mono text-2xs text-muted">
            {FIN_SUBJECT.ticker}
          </span>
          <Badge tone="accent">Mock</Badge>
        </div>
      }
    >
      {children}
    </WorkspaceLayout>
  );
}
