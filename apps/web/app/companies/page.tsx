import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CompaniesLive } from "@/components/company/companies-live";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <AppShell title="Companies">
      <PageHeader
        eyebrowKey="page.companies.eyebrow"
        titleKey="page.companies.title"
        descriptionKey="page.companies.desc"
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
