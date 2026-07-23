"use client";

/**
 * Live financial sections — the client components behind every /financials
 * page. Each section resolves its data through the one loader seam
 * (useApiResource → Resource<T> → <DataState>): live from the API for the
 * selected subject, or the labelled sample data when no API is configured.
 * No section computes a financial number — display only.
 */
import { fmtNumber } from "@/lib/format";
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
import { useLocale } from "@/lib/i18n/use-locale";
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
    title: { en: "Income statement", zh: "利润表" },
    description: {
      en: "Revenue, costs and earnings by period.",
      zh: "各期的营收、成本与盈利。",
    },
    mock: INCOME_STATEMENT,
  },
  "balance-sheet": {
    title: { en: "Balance sheet", zh: "资产负债表" },
    description: {
      en: "Assets, liabilities and equity by period.",
      zh: "各期的资产、负债与权益。",
    },
    mock: BALANCE_SHEET,
  },
  "cash-flow": {
    title: { en: "Cash flow", zh: "现金流量表" },
    description: {
      en: "Operating, investing and financing flows by period.",
      zh: "各期的经营、投资与筹资现金流。",
    },
    mock: CASH_FLOW,
  },
} as const;

type StatementType = keyof typeof STATEMENT_CONFIG;

const sampleNote = (isSample: boolean, zh: boolean) =>
  isSample
    ? zh
      ? " 示例数据 — 配置 API 以获取实时数据。"
      : " Sample data — configure the API for live figures."
    : "";

const dataFooter = (isSample: boolean, zh: boolean) =>
  isSample
    ? zh
      ? "示意性示例数据"
      : "Illustrative sample data"
    : zh
      ? "通过 Atlas API 的来源可溯数据"
      : "Source-linked data via Atlas API";

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
  fmtNumber(v === undefined ? undefined : Math.round(v));

export function OverviewSection() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { isSample } = useFinancialSubject();
  const r = useFinancialsResource();
  const latest = <T,>(xs: T[] | undefined): T | undefined =>
    xs && xs.length > 0 ? xs[xs.length - 1] : undefined;

  const d = r.data;
  const latestLabel = latest(d?.periods) ?? (zh ? "最新" : "latest");

  return (
    <>
      <SectionHeading
        title={zh ? "总览" : "Overview"}
        description={
          zh
            ? `所选标的的核心数据与趋势。${sampleNote(isSample, zh)}`
            : `Headline figures and trends for the selected subject.${sampleNote(isSample, zh)}`
        }
      />
      <DataState status={r.status}>
        {d ? (
          <>
            <div className="mb-6">
              <StatGrid
                items={[
                  {
                    label: zh ? `营收 (${latestLabel})` : `Revenue (${latestLabel})`,
                    value: fmtM(latest(d.trends.revenue)?.value),
                    hint: d.unit,
                  },
                  {
                    label: zh ? "净利润" : "Net income",
                    value: fmtM(latest(d.trends.netIncome)?.value),
                    hint: d.unit,
                  },
                  {
                    label: zh ? "自由现金流" : "Free cash flow",
                    value: fmtM(latest(d.trends.freeCashFlow)?.value),
                    hint: d.unit,
                  },
                  {
                    label: zh ? "覆盖范围" : "Coverage",
                    value: zh ? `${d.periods.length} 年` : `${d.periods.length} yrs`,
                    hint: `${d.periods[0]} – ${latestLabel}`,
                  },
                ]}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartContainer
                title={zh ? "营收" : "Revenue"}
                subtitle={`${zh ? "年度" : "Annual"} · ${d.unit}`}
                footer={dataFooter(isSample, zh)}
              >
                <TrendChart data={d.trends.revenue} ariaLabel="Annual revenue trend" />
              </ChartContainer>
              <ChartContainer
                title={zh ? "净利润" : "Net income"}
                subtitle={`${zh ? "年度" : "Annual"} · ${d.unit}`}
                footer={dataFooter(isSample, zh)}
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
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { isSample } = useFinancialSubject();
  const cfg = STATEMENT_CONFIG[type];
  const title = zh ? cfg.title.zh : cfg.title.en;
  const description = zh ? cfg.description.zh : cfg.description.en;
  const path = useSubjectPath(`/statements/${type}`);
  const r = useApiResource<StatementPayload>(
    path,
    ready({ periods: ANNUAL_PERIODS, rows: cfg.mock }),
  );

  return (
    <>
      <SectionHeading
        title={title}
        description={
          zh
            ? `${description} 数据由财务智能引擎在服务端计算。${sampleNote(isSample, zh)}`
            : `${description} Figures are computed server-side by the Financial Intelligence Engine.${sampleNote(isSample, zh)}`
        }
      />
      <DataState status={r.status}>
        {r.data ? (
          <Panel className="overflow-hidden">
            <StatementTable
              periods={r.data.periods}
              rows={r.data.rows}
              unit={isSample ? "USD millions" : undefined}
              caption={zh ? `${title}，年度` : `${title}, annual`}
            />
          </Panel>
        ) : null}
      </DataState>
    </>
  );
}

// --- Metrics ----------------------------------------------------------------

export function MetricsSection() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { isSample } = useFinancialSubject();
  const path = useSubjectPath("/metrics");
  const r = useApiResource<MetricRow[]>(path, ready(METRICS));

  const metricColumns: Column<MetricRow>[] = [
    { key: "label", header: zh ? "指标" : "Metric" },
    { key: "latest", header: zh ? "最新" : "Latest", numeric: true },
    {
      key: "trend",
      header: zh ? "趋势" : "Trend",
      align: "right",
      render: (row) =>
        row.series.length >= 2 ? (
          <Sparkline values={row.series} ariaLabel={`${row.label} trend`} />
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];

  return (
    <>
      <SectionHeading
        title={zh ? "财务指标" : "Financial metrics"}
        description={
          zh
            ? `每项指标附带微趋势的关键比率，由比率引擎计算，绝不在 UI 中计算。${sampleNote(isSample, zh)}`
            : `Key ratios with a micro-trend per metric, computed by the Ratio Engine — never in the UI.${sampleNote(isSample, zh)}`
        }
      />
      <DataState status={r.status}>
        {r.data ? (
          <Panel className="overflow-hidden">
            <DataTable
              columns={metricColumns}
              rows={r.data}
              getRowId={(row) => row.label}
              caption={zh ? "财务指标" : "Financial metrics"}
            />
          </Panel>
        ) : null}
      </DataState>
    </>
  );
}

// --- Ratios -----------------------------------------------------------------

export function RatiosSection() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { isSample } = useFinancialSubject();
  const path = useSubjectPath("/ratios");
  const r = useApiResource<RatioGroup[]>(path, ready(RATIO_GROUPS));

  return (
    <>
      <SectionHeading
        title={zh ? "比率仪表盘" : "Ratio dashboard"}
        description={
          zh
            ? `按类别划分的关键比率，由比率引擎在服务端计算（P004）。估值倍数为独立模块。${sampleNote(isSample, zh)}`
            : `Key ratios by category, computed by the Ratio Engine server-side (P004). Valuation multiples are a separate module.${sampleNote(isSample, zh)}`
        }
      />
      <DataState status={r.status}>
        <div className="flex flex-col gap-6">
          {(r.data ?? []).map((group) => (
            <Panel key={group.title}>
              <PanelHeader
                eyebrow={zh ? "类别" : "Category"}
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
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { isSample } = useFinancialSubject();
  const r = useFinancialsResource();

  return (
    <>
      <SectionHeading
        title={zh ? "历史趋势" : "Historical trends"}
        description={
          zh
            ? `核心报表的多年走势。${sampleNote(isSample, zh)}`
            : `Multi-year trajectory across the core statements.${sampleNote(isSample, zh)}`
        }
      />
      <DataState status={r.status}>
        {r.data ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {(
              [
                ["Revenue", "营收", r.data.trends.revenue],
                ["Net income", "净利润", r.data.trends.netIncome],
                ["Free cash flow", "自由现金流", r.data.trends.freeCashFlow],
              ] as const
            ).map(([title, titleZh, series]) =>
              series.length > 0 ? (
                <ChartContainer
                  key={title}
                  title={zh ? titleZh : title}
                  subtitle={`${zh ? "年度" : "Annual"} · ${r.data!.unit}`}
                  footer={dataFooter(isSample, zh)}
                >
                  <TrendChart data={series} ariaLabel={`Annual ${title.toLowerCase()} trend`} />
                </ChartContainer>
              ) : (
                <ChartContainer
                  key={title}
                  title={zh ? titleZh : title}
                  subtitle={zh ? "等待数据" : "Awaiting data"}
                  status="empty"
                >
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
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { isSample } = useFinancialSubject();
  const noun = periodType === "annual" ? "Annual" : "Quarterly";
  const nounZh = periodType === "annual" ? "年度" : "季度";
  const resultsTitle = zh ? `${nounZh}业绩` : `${noun} results`;
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
        title={resultsTitle}
        description={
          zh
            ? `覆盖窗口内的${nounZh}业绩。${sampleNote(isSample, zh)}`
            : `${noun} results across the coverage window.${sampleNote(isSample, zh)}`
        }
        action={
          <Badge tone="neutral">
            {zh ? `${rows.length} 个报告期` : `${rows.length} periods`}
          </Badge>
        }
      />
      <DataState
        status={r.status}
        empty={
          <Panel className="p-8 text-center text-sm text-muted">
            {zh
              ? `此标的暂无${nounZh}业绩数据。季度数据接入将随手套板块合并（P026）与 P022 一并上线。`
              : `No ${periodType === "annual" ? "annual" : "quarterly"} results in coverage for this subject yet. Quarterly ingestion lands with the glove sector merge (P026) and P022.`}
          </Panel>
        }
      >
        <div className="mb-6">
          <ChartContainer
            title={
              zh
                ? `按${periodType === "annual" ? "年度" : "季度"}划分的营收`
                : `Revenue by ${periodType === "annual" ? "year" : "quarter"}`
            }
            subtitle={zh ? "各期营收" : "Revenue per period"}
            footer={dataFooter(isSample, zh)}
          >
            <BarSeries data={revenueByPeriod} ariaLabel={`Revenue by ${periodType}`} />
          </ChartContainer>
        </div>
        <Panel className="overflow-hidden">
          <ResultsTable rows={rows} pageSize={10} caption={resultsTitle} />
        </Panel>
      </DataState>
    </>
  );
}
