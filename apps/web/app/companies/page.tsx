import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { CompaniesBrowser } from "@/components/company/companies-browser";
import { MOCK_COMPANIES } from "@/lib/mock/companies";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <AppShell title="Companies">
      <PageHeader
        eyebrow="Company Intelligence"
        title="Companies"
        description="The coverage universe. Browse the labelled sample; profiles, scores and financials populate once a backend contract is wired."
        actions={
          <span className="inline-flex cursor-not-allowed items-center rounded border border-border bg-surface px-3 py-2 text-sm text-faint">
            + Add company
          </span>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge tone="accent">Sample universe</Badge>
        <span className="text-xs text-muted">
          {MOCK_COMPANIES.length} companies · mock data
        </span>
      </div>

      <CompaniesBrowser companies={MOCK_COMPANIES} />
    </AppShell>
  );
}
