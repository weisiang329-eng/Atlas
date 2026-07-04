import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ReportsBrowser } from "@/components/report/reports-browser";
import { REPORT_INDEX } from "@/lib/mock/reports";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <AppShell title="Reports">
      <PageHeader
        eyebrow="Report library"
        title="Intelligence reports"
        description="Decision documents — not exports. Each answers what changed, why, who is affected, the evidence, and the decision to consider next. Sample content only."
        actions={<Badge tone="accent">Mock library</Badge>}
      />
      <ReportsBrowser items={REPORT_INDEX} />
    </AppShell>
  );
}
