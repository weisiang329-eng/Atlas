import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CompaniesLive } from "@/components/company/companies-live";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <AppShell title="Companies">
      <PageHeader
        eyebrow="Company Intelligence"
        title="Companies"
        description="The coverage universe. Profiles and financials are served by the Atlas API; scores arrive with P010."
        actions={
          <span className="inline-flex cursor-not-allowed items-center rounded border border-border bg-surface px-3 py-2 text-sm text-faint">
            + Add company
          </span>
        }
      />
      <CompaniesLive />
    </AppShell>
  );
}
