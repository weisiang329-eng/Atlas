"use client";

/**
 * Live financial sections — the client components behind every /financials
 * page. Each section resolves its data through the one loader seam
 * (useApiResource → Resource<T> → <DataState>): live from the API for the
 * selected subject, or the labelled sample data when no API is configured.
 * No section computes a financial number — display only.
 */
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/ui/stat-grid";
import { DataState } from "@/components/ui/data-state";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatementTable } from "@/components/data/statement-table";
import { ResultsTable } from "@/components/data/results-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import { BarSeries } from "@/components/chart/bar-series";
import { Sparkline } from "@/components/chart/sparkline";
import { useApiResource } from "@/lib/loaders/use-api";
import { ready, type Resource } from "@/lib/resource";
import type {
  CompanyFinancials,
  MetricRow,
  RatioGroup,
  ResultRow,
  StatementPayload,
} from "@/lib/types";
import {
  ANNUAL_PERIODS,
  ANNUAL_RESULTS,
  BALANCE_SHEET,
  CASH_FLOW,
  INCOME_STATEMENT,
  METRICS,
  QUARTERLY_RESULTS,
  TREND_FCF,
  TREND_NET_INCOME,
  TREND_REVENUE,
} from "@/lib/mock/financials";
import { RATIO_GROUPS } from "@/lib/mock/ratios";
import { useFinancialSubject, useSubjectPath } from "./subject-context";

/** Statement-type routing shared by the three statement pages. */
const STATEMENT_CONFIG = {
  "income-statement": {
    title: "Income statement",
    description: "Revenue, costs and earnings by period.",
    mock: INCOME_STATEMENT,
  },
  "balance-sheet": {
    title: "Balance sheet",
    description: "Assets, liabilities and equity by period.",
    mock: BALANCE_SHEET,
  },
  "cash-flow": {
    title: "Cash flow",
    description: "Operating, investing and financing flows by period.",
    mock: CASH_FLOW,
  },
} as const;

type StatementType = keyof typeof STATEMENT_CONFIG;

const sampleNote = (isSample: boolean) =>
  isSample ? " Sample data — configure the API for live figures." : "";

function useFinancialsResource(): Resource<CompanyFinancials> {
  const path = useSubjectPath("/financials");
  const { subject } = useFinancialSubject();
  const mock: CompanyFinancials = {
    company: { id: subject.id, name: subject.name, ticker: subject.ticker },
    periods: ANNUAL_PERIODS,
    unit: "USD millions",
    currency: "USD",
    statements: {
      incomeStatement: INCOME_STATEMENT,
      balanceSheet: BALANCE_SHEET,
      cashFlow: CASH_FLOW,
    },
    metrics: METRICS,
    ratioGroups: RATIO_GROUPS,
    trends: {
      revenue: TREND_REVENUE,
      netIncome: TREND_NET_INCOME,
      freeCashFlow: TREND_FCF,
    },
  };
  return useApiResource<CompanyFinancials>(path, ready(mock));
}

// --- Overview ---------------------------------------------------------------

const fmtM = (v: number | undefined): string =>
  v === undefined ? "—" : Math.round(v).toLocaleString("en-US");

export function OverviewSection() {
  const { isSample } = useFinancialSubject();
  const r = useFinancialsResource();
  const latest = <T,>(xs: T[] | undefined): T | undefined =>
    xs && xs.length > 0 ? xs[xs.length - 1] : undefined;

  const d = r.data;
  const latestLabel = latest(d?.periods) ?? "latest";

  return (
    <>
      <SectionHeading
        title="Overview"
        description={`Headline figures and trends for the selected subject.${sampleNote(isSample)}`}
      />
      <DataState status={r.status}>
        {d ? (
          <>
            <div className="mb-6">
              <StatGrid
                items={[
                  {
                    label: `Revenue (${latestLabel})`,
                    value: fmtM(latest(d.trends.revenue)?.value),
                    hint: d.unit,
                  },
                  {
                    label: "Net income",
                    value: fmtM(latest(d.trends.netIncome)?.value),
                    hint: d.unit,
                  },
                  {
                    label: "Free cash flow",
                    value: fmtM(latest(d.trends.freeCashFlow)?.value),
                    hint: d.unit,
                  },
                  {
                    label: "Coverage",
                    value: `${d.periods.length} yrs`,
                    hint: `${d.periods[0]} – ${latestLabel}`,
                  },
                ]}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartContainer
                title="Revenue"
                subtitle={`Annual · ${d.unit}`}
                footer={isSample ? "Illustrative sample data" : "Source-linked data via Atlas API"}
              >
                <TrendChart data={d.trends.revenue} ariaLabel="Annual revenue trend" />
              </ChartContainer>
              <ChartContainer
                title="Net income"
                subtitle={`Annual · ${d.unit}`}
                footer={isSample ? "Illustrative sample data" : "Source-linked data via Atlas API"}
              >
                <BarSeries data={d.trends.netIncome} ariaLabel="Annual net income" />
              </ChartContainer>
            </div>
          </>
        ) : null}
      </DataState>
    </>
  );
}

// --- Statements -------------------------------------------------------------

export function StatementSection({ type }: { type: StatementType }) {
  const { isSample } = useFinancialSubject();
  const cfg = STATEMENT_CONFIG[type];
  const path = useSubjectPath(`/statements/${type}`);
  const r = useApiResource<StatementPayload>(
    path,
    ready({ periods: ANNUAL_PERIODS, rows: cfg.mock }),
  );

  return (
    <>
      <SectionHeading
        title={cfg.title}
        description={`${cfg.description} Figures are computed server-side by the Financial Intelligence Engine.${sampleNote(isSample)}`}
      />
      <DataState status={r.status}>
        {r.data ? (
          <Panel className="overflow-hidden">
            <StatementTable
              periods={r.data.periods}
              rows={r.data.rows}
              unit={isSample ? "USD millions" : undefined}
              caption={`${cfg.title}, annual`}
            />
          </Panel>
        ) : null}
      </DataState>
    </>
  );
}

// --- Metrics ----------------------------------------------------------------

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

export function MetricsSection() {
  const { isSample } = useFinancialSubject();
  const path = useSubjectPath("/metrics");
  const r = useApiResource<MetricRow[]>(path, ready(METRICS));

  return (
    <>
      <SectionHeading
        title="Financial metrics"
        description={`Key ratios with a micro-trend per metric, computed by the Ratio Engine — never in the UI.${sampleNote(isSample)}`}
      />
      <DataState status={r.status}>
        {r.data ? (
          <Panel className="overflow-hidden">
            <DataTable
              columns={metricColumns}
              rows={r.data}
              getRowId={(row) => row.label}
              caption="Financial metrics"
            />
          </Panel>
        ) : null}
      </DataState>
    </>
  );
}

// --- Ratios -----------------------------------------------------------------

export function RatiosSection() {
  const { isSample } = useFinancialSubject();
  const path = useSubjectPath("/ratios");
  const r = useApiResource<RatioGroup[]>(path, ready(RATIO_GROUPS));

  return (
    <>
      <SectionHeading
        title="Ratio dashboard"
        description={`Key ratios by category, computed by the Ratio Engine server-side (P004). Valuation multiples are a separate module.${sampleNote(isSample)}`}
      />
      <DataState status={r.status}>
        <div className="flex flex-col gap-6">
          {(r.data ?? []).map((group) => (
            <Panel key={group.title}>
              <PanelHeader
                eyebrow="Category"
                title={group.title}
                action={
                  <span className="hidden text-xs text-muted sm:inline">
                    {group.description}
                  </span>
                }
              />
              <PanelBody>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {group.ratios.map((ratio) => (
                    <KpiCard
                      key={ratio.label}
                      label={ratio.label}
                      value={ratio.value}
                      delta={ratio.delta}
                      direction={ratio.direction}
                      series={ratio.series}
                    />
                  ))}
                </div>
              </PanelBody>
            </Panel>
          ))}
        </div>
      </DataState>
    </>
  );
}

// --- Trends -----------------------------------------------------------------

export function TrendsSection() {
  const { isSample } = useFinancialSubject();
  const r = useFinancialsResource();

  return (
    <>
      <SectionHeading
        title="Historical trends"
        description={`Multi-year trajectory across the core statements.${sampleNote(isSample)}`}
      />
      <DataState status={r.status}>
        {r.data ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {(
              [
                ["Revenue", r.data.trends.revenue],
                ["Net income", r.data.trends.netIncome],
                ["Free cash flow", r.data.trends.freeCashFlow],
              ] as const
            ).map(([title, series]) =>
              series.length > 0 ? (
                <ChartContainer
                  key={title}
                  title={title}
                  subtitle={`Annual · ${r.data!.unit}`}
                  footer={isSample ? "Illustrative sample data" : "Source-linked data via Atlas API"}
                >
                  <TrendChart data={series} ariaLabel={`Annual ${title.toLowerCase()} trend`} />
                </ChartContainer>
              ) : (
                <ChartContainer key={title} title={title} subtitle="Awaiting data" status="empty">
                  <div />
                </ChartContainer>
              ),
            )}
          </div>
        ) : null}
      </DataState>
    </>
  );
}

// --- Results ----------------------------------------------------------------

export function ResultsSection({ periodType }: { periodType: "annual" | "quarter" }) {
  const { isSample } = useFinancialSubject();
  const noun = periodType === "annual" ? "Annual" : "Quarterly";
  const path = useSubjectPath(`/results?period=${periodType}`);
  const r = useApiResource<ResultRow[]>(
    path,
    ready(periodType === "annual" ? ANNUAL_RESULTS : QUARTERLY_RESULTS),
  );

  const rows = r.data ?? [];
  const revenueByPeriod = rows
    .filter((row) => row.revenue !== null)
    .map((row) => ({ label: row.period, value: row.revenue as number }))
    .reverse();

  return (
    <>
      <SectionHeading
        title={`${noun} results`}
        description={`${noun} results across the coverage window.${sampleNote(isSample)}`}
        action={<Badge tone="neutral">{rows.length} periods</Badge>}
      />
      <DataState
        status={r.status}
        empty={
          <Panel className="p-8 text-center text-sm text-muted">
            No {periodType === "annual" ? "annual" : "quarterly"} results in
            coverage for this subject yet. Quarterly ingestion lands with the
            glove sector merge (P026) and P022.
          </Panel>
        }
      >
        <div className="mb-6">
          <ChartContainer
            title={`Revenue by ${periodType === "annual" ? "year" : "quarter"}`}
            subtitle="Revenue per period"
            footer={isSample ? "Illustrative sample data" : "Source-linked data via Atlas API"}
          >
            <BarSeries data={revenueByPeriod} ariaLabel={`Revenue by ${periodType}`} />
          </ChartContainer>
        </div>
        <Panel className="overflow-hidden">
          <ResultsTable rows={rows} pageSize={10} caption={`${noun} results`} />
        </Panel>
      </DataState>
    </>
  );
}
