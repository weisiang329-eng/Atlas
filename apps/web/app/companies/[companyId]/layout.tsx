import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { Badge } from "@/components/ui/badge";
import { companyTabs } from "@/lib/nav";
import { HeaderScore } from "@/components/company/header-score";
import { getStaticCompany, STATIC_UNIVERSE } from "@/lib/universe";

// Static export: pre-render every company in the sample universe.
export function generateStaticParams() {
  return STATIC_UNIVERSE.map((c) => ({ companyId: c.id }));
}

export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = getStaticCompany(companyId);
  const name = company?.name ?? "Unknown company";
  const monogram = (company?.ticker ?? companyId).slice(0, 2).toUpperCase();

  return (
    <WorkspaceLayout
      title={company?.name ?? "Company"}
      tabs={companyTabs(companyId)}
      header={
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-panel border border-border bg-surface-2 font-mono text-lg font-semibold text-faint">
            {monogram}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-serif text-2xl font-semibold text-fg">
                {name}
              </h1>
              <Badge tone="accent">Sample</Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-muted">
              {company
                ? `${company.exchange}: ${company.ticker} · ${company.segment}`
                : "Not in the sample universe"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex cursor-not-allowed items-center rounded border border-border bg-surface px-3 py-2 text-sm text-faint">
            ☆ Watchlist
          </span>
          <div className="rounded border border-border bg-surface px-3 py-2 text-right">
            <p className="eyebrow">Atlas Score</p>
            <HeaderScore companyId={companyId} />
          </div>
        </div>
      </div>
      }
    >
      {children}
    </WorkspaceLayout>
  );
}
