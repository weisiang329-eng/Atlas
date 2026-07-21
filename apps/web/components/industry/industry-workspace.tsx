"use client";

/**
 * Industry workspace — cost-factor and output-price series, the derived cycle
 * signal, and the member companies, for one industry. Live from the API; no
 * sample fallback (there is no truthful mock for an industry's real cost
 * curves), so without an API configured it shows the empty/guidance state.
 */
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/ui/stat-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import { DataTable, type Column } from "@/components/data/data-table";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type { CompanySummary, IndustryDetail, MetricSeries } from "@/lib/types";

const pct = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const companyColumns: Column<CompanySummary>[] = [
  {
    key: "name",
    header: "Company",
    sortable: true,
    render: (c) => (
      <Link href={`/companies/${c.id}/overview`} className="text-fg hover:text-accent">
        {c.name}
      </Link>
    ),
  },
  { key: "ticker", header: "Ticker", sortable: true },
  { key: "exchange", header: "Exchange" },
  { key: "country", header: "Country", sortable: true },
];

function toChart(series: MetricSeries) {
  return series.points.map((p) => ({ label: p.date.slice(0, 7), value: p.value }));
}

export function IndustryWorkspace({ industryId }: { industryId: string }) {
  const live = isApiConfigured();
  const r = useApiResource<IndustryDetail>(
    live ? `/v1/industries/${industryId}` : null,
  );

  if (!live) {
    return (
      <EmptyState
        title="API not configured"
        body="Set NEXT_PUBLIC_API_BASE_URL at build time to load live industry intelligence — cost factors, output prices and the margin cycle signal."
      />
    );
  }

  const d = r.data;

  return (
    <DataState
      status={r.status}
      empty={
        <EmptyState
          title="No industry data yet"
          body="This industry is in the taxonomy but has no cost/price series or companies mapped yet."
        />
      }
    >
      {d ? (
        <>
          <PageHeader
            eyebrow={d.sector}
            title={d.name}
            description={d.description ?? undefined}
            actions={<Badge tone="accent">{d.companies.length} companies</Badge>}
          />

          {d.cycleSignal ? (
            <div className="mb-6">
              <StatGrid
                items={[
                  ...d.series.map((s) => ({
                    label: s.label,
                    value: s.latest === null ? "—" : `${s.latest.toLocaleString("en-US")}`,
                    hint: `${s.unit} · YoY ${pct(s.changeYoYPct)}`,
                  })),
                  {
                    label: "Margin cycle (indexed)",
                    value: d.cycleSignal.latest === null ? "—" : String(d.cycleSignal.latest),
                    hint: `100 = cycle start · YoY ${pct(d.cycleSignal.changeYoYPct)}`,
                  },
                ]}
              />
            </div>
          ) : null}

          {d.series.length > 0 ? (
            <>
              <SectionHeading
                title="Cost factors & output prices"
                description="The spread between output price and input cost drives the industry's earnings cycle. Source-linked series."
              />
              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                {d.series.map((s) => (
                  <ChartContainer
                    key={s.key}
                    title={s.label}
                    subtitle={`${s.unit} · latest ${s.latest?.toLocaleString("en-US") ?? "—"} (${s.latestDate ?? "—"})`}
                    footer="Source-linked data via Atlas API"
                  >
                    <TrendChart data={toChart(s)} ariaLabel={`${s.label} history`} />
                  </ChartContainer>
                ))}
                {d.cycleSignal ? (
                  <ChartContainer
                    title="Margin cycle signal"
                    subtitle={d.cycleSignal.label}
                    footer="Derived: output price ÷ input cost, indexed"
                  >
                    <TrendChart
                      data={d.cycleSignal.points.map((p) => ({ label: p.date.slice(0, 7), value: p.value }))}
                      ariaLabel="Margin cycle signal"
                    />
                  </ChartContainer>
                ) : null}
              </div>
            </>
          ) : null}

          <SectionHeading
            title="Companies in this industry"
            description="Members of the coverage universe mapped to this industry."
          />
          <Panel className="overflow-hidden">
            <DataTable
              columns={companyColumns}
              rows={d.companies}
              getRowId={(c) => c.id}
              searchable
              searchPlaceholder="Search companies"
              caption={`${d.name} — companies`}
            />
          </Panel>
        </>
      ) : null}
    </DataState>
  );
}
