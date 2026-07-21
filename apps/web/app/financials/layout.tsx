import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { FINANCIAL_TABS } from "@/lib/nav";
import { FinancialSubjectProvider } from "@/components/financial/subject-context";
import { SubjectSelector } from "@/components/financial/subject-selector";

export default function FinancialsLayout({ children }: { children: ReactNode }) {
  return (
    <FinancialSubjectProvider>
      <WorkspaceLayout
        title="Financials"
        eyebrow="Financial workspace"
        description="Statements, metrics and results for the selected subject, computed server-side by the Financial Intelligence Engine."
        tabs={FINANCIAL_TABS}
        actions={<SubjectSelector />}
      >
        {children}
      </WorkspaceLayout>
    </FinancialSubjectProvider>
  );
}
