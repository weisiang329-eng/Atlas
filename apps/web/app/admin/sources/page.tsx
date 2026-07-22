import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { DataSources } from "@/components/admin/data-sources";

export const metadata: Metadata = { title: "Data Sources" };

/** Every external source: status, rate limit, registration steps. */
export default function DataSourcesPage() {
  return (
    <AppShell title="Data Sources">
      <PageHeader
        eyebrowKey="page.sources.eyebrow"
        titleKey="page.sources.title"
        descriptionKey="page.sources.desc"
      />
      <DataSources />
    </AppShell>
  );
}
