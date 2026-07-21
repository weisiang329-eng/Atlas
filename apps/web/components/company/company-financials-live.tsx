"use client";

/**
 * Per-company financials tab — statements + key metrics for the company in
 * the route (no subject context; the URL decides). Without an API configured
 * there is nothing truthful to show for a specific company, so the section
 * renders the empty state with guidance.
 */
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { StatementTable } from "@/components/data/statement-table";
import { DataTable, type Column } from "@/components/data/data-table";
import { Sparkline } from "@/components/chart/sparkline";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type { CompanyFinancials, MetricRow } from "@/lib/types";

const metricColumns: Column<MetricRow>[] = [
  { key: "label", header: "Metric" },
  { key: "latest", header: "Latest", numeric: true },
  {
    key: "trend",
    header: "Trend",
    align: "right",
    render: (row) =>
      row.series.length >= 2 ? (
        <Sparkline values={row.series} ariaLabel={`${row.label} trend`} />
      ) : (
        <span className="text-faint">—</span>
      ),
  },
];

export function CompanyFinancialsLive({ companyId }: { companyId: string }) {
  const live = isApiConfigured();
  const r = useApiResource<CompanyFinancials>(
    live ? `/v1/companies/${companyId}/financials` : null,
  );

  if (!live) {
    return (
      <>
        <SectionHeading
          title="Financials"
          description="Reported statements and derived metrics, computed by the Financial Intelligence Engine."
        />
        <EmptyState
          title="API not configured"
          body="Set NEXT_PUBLIC_API_BASE_URL at build time to load this company's live financials."
        />
      </>
    );
  }

  return (
    <>
      <SectionHeading
        title="Financials"
        description="Reported statements and derived metrics, computed by the Financial Intelligence Engine."
      />
      <DataState
        status={r.status}
        empty={
          <EmptyState
            title="No financial coverage yet"
            body="This company is in the universe but has no seeded periods. Coverage grows with ingestion (P022)."
          />
        }
      >
        {r.data ? (
          <div className="flex flex-col gap-6">
            <Panel className="overflow-hidden">
              <StatementTable
                periods={r.data.periods}
                rows={r.data.statements.incomeStatement}
                unit={r.data.unit}
                caption="Income statement, annual"
              />
            </Panel>
            <Panel className="overflow-hidden">
              <DataTable
                columns={metricColumns}
                rows={r.data.metrics}
                getRowId={(row) => row.label}
                caption="Key metrics"
              />
            </Panel>
          </div>
        ) : null}
      </DataState>
    </>
  );
}
