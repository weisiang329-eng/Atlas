"use client";

/**
 * Industry workspace — cost-factor and output-price series, the derived cycle
 * signal, and the member companies, for one industry. Live from the API; no
 * sample fallback (there is no truthful mock for an industry's real cost
 * curves), so without an API configured it shows the empty/guidance state.
 */
import { fmtNumber } from "@/lib/format";
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
import { IndustryKnowledgePanel } from "@/components/industry/industry-knowledge-panel";
import { DriverPanel } from "@/components/industry/driver-panel";
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
          {/* Where this industry sits in the taxonomy. The nesting conveys
              depth; the level number is schema vocabulary and never shown
              (docs/INDUSTRY-INTELLIGENCE.md §1). */}
          {d.path && d.path.length > 1 ? (
            <nav aria-label="Industry taxonomy" className="mb-2 flex flex-wrap items-center gap-1.5 text-2xs">
              {d.path.map((node, i) => (
                <span key={node.id} className="flex items-center gap-1.5">
                  {i > 0 ? <span className="text-faint">›</span> : null}
                  {node.id === d.id ? (
                    <span className="text-fg">{node.nameZh ?? node.name}</span>
                  ) : (
                    <Link href={`/industries/${node.id}`} className="text-muted hover:text-accent">
                      {node.nameZh ?? node.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          ) : null}

          <PageHeader
            eyebrow={d.sector}
            title={d.name}
            description={d.description ?? undefined}
            actions={<Badge tone="accent">{d.companies.length} companies</Badge>}
          />

          {/* The way down. A sub-industry with no company filed on it yet is
              shown with a real zero rather than hidden — the taxonomy states
              where coverage is missing, which is the point of having it. */}
          {d.children && d.children.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-2xs text-faint">细分</span>
              {d.children.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/industries/${ch.id}`}
                  className="rounded-pill border border-border px-2.5 py-1 text-2xs text-muted transition-colors hover:border-accent-dim hover:text-fg"
                >
                  {ch.nameZh ?? ch.name}
                  <span className="num ml-1.5 text-faint">{ch.companyCount}</span>
                </Link>
              ))}
            </div>
          ) : null}

          {d.cycleSignal ? (
            <div className="mb-6">
              <StatGrid
                items={[
                  ...d.series.map((s) => ({
                    label: s.label,
                    value: fmtNumber(s.latest),
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
                    subtitle={`${s.unit} · latest ${fmtNumber(s.latest)} (${s.latestDate ?? "—"})`}
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

          {/* The causal layer, above everything descriptive: "what moves this"
              is the question a decision needs, and each claim carries its own
              backtest so a checked one is distinguishable from a guess. */}
          <SectionHeading
            title="什么在驱动这个行业"
            description="每条驱动因素都是一个可证伪的断言：相位、滞后、弹性。下面并列显示它在真实数据上的检验结果 —— 包括被数据否定的那些。"
          />
          <div className="mb-6">
            <DriverPanel industryId={d.id} />
          </div>

          {/* Book 2's knowledge scorecard. Placed above the company list
              because "what do we still not know about this industry" is the
              research question; the member list is reference. */}
          <div className="mb-6">
            <IndustryKnowledgePanel industryId={d.id} />
          </div>

          <SectionHeading
            title="Companies in this industry"
            description="Members of the coverage universe mapped to this industry."
          />
          <Panel className="overflow-hidden">
            <DataTable columnPickerId="industry-compare"
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
