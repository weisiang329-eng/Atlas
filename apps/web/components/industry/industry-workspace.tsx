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
import { useLocale } from "@/lib/i18n/use-locale";
import { isApiConfigured } from "@/lib/api/client";
import type { CompanySummary, IndustryDetail, MetricSeries } from "@/lib/types";

const pct = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const companyColumns = (zh: boolean): Column<CompanySummary>[] => [
  {
    key: "name",
    header: zh ? "公司" : "Company",
    sortable: true,
    render: (c) => (
      <Link href={`/companies/${c.id}/overview`} className="text-fg hover:text-accent">
        {c.name}
      </Link>
    ),
  },
  { key: "ticker", header: zh ? "代码" : "Ticker", sortable: true },
  { key: "exchange", header: zh ? "交易所" : "Exchange" },
  { key: "country", header: zh ? "国家/地区" : "Country", sortable: true },
];

function toChart(series: MetricSeries) {
  return series.points.map((p) => ({ label: p.date.slice(0, 7), value: p.value }));
}

export function IndustryWorkspace({ industryId }: { industryId: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const live = isApiConfigured();
  const r = useApiResource<IndustryDetail>(
    live ? `/v1/industries/${industryId}` : null,
  );

  if (!live) {
    return (
      <EmptyState
        title={zh ? "API 未配置" : "API not configured"}
        body={
          zh
            ? "在构建时设置 NEXT_PUBLIC_API_BASE_URL 以加载实时行业情报 —— 成本要素、产出价格与利润率周期信号。"
            : "Set NEXT_PUBLIC_API_BASE_URL at build time to load live industry intelligence — cost factors, output prices and the margin cycle signal."
        }
      />
    );
  }

  const d = r.data;

  return (
    <DataState
      status={r.status}
      empty={
        <EmptyState
          title={zh ? "暂无行业数据" : "No industry data yet"}
          body={
            zh
              ? "该行业已在分类体系中，但尚未映射成本/价格序列或成员公司。"
              : "This industry is in the taxonomy but has no cost/price series or companies mapped yet."
          }
        />
      }
    >
      {d ? (
        <>
          {/* Where this industry sits in the taxonomy. The nesting conveys
              depth; the level number is schema vocabulary and never shown
              (docs/INDUSTRY-INTELLIGENCE.md §1). */}
          {d.path && d.path.length > 1 ? (
            <nav aria-label={zh ? "行业分类" : "Industry taxonomy"} className="mb-2 flex flex-wrap items-center gap-1.5 text-2xs">
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
            actions={<Badge tone="accent">{d.companies.length} {zh ? "家公司" : "companies"}</Badge>}
          />

          {/* The way down. A sub-industry with no company filed on it yet is
              shown with a real zero rather than hidden — the taxonomy states
              where coverage is missing, which is the point of having it. */}
          {d.children && d.children.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-2xs text-faint">{zh ? "细分" : "Sub-industries"}</span>
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
                    label: zh ? "利润率周期（指数化）" : "Margin cycle (indexed)",
                    value: d.cycleSignal.latest === null ? "—" : String(d.cycleSignal.latest),
                    hint: `${zh ? "100 = 周期起点" : "100 = cycle start"} · YoY ${pct(d.cycleSignal.changeYoYPct)}`,
                  },
                ]}
              />
            </div>
          ) : null}

          {d.series.length > 0 ? (
            <>
              <SectionHeading
                title={zh ? "成本要素与产出价格" : "Cost factors & output prices"}
                description={
                  zh
                    ? "产出价格与投入成本之间的价差驱动着行业的盈利周期。均为可溯源序列。"
                    : "The spread between output price and input cost drives the industry's earnings cycle. Source-linked series."
                }
              />
              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                {d.series.map((s) => (
                  <ChartContainer
                    key={s.key}
                    title={s.label}
                    subtitle={`${s.unit} · ${zh ? "最新" : "latest"} ${fmtNumber(s.latest)} (${s.latestDate ?? "—"})`}
                    footer={zh ? "通过 Atlas API 提供的可溯源数据" : "Source-linked data via Atlas API"}
                  >
                    <TrendChart data={toChart(s)} ariaLabel={`${s.label} history`} />
                  </ChartContainer>
                ))}
                {d.cycleSignal ? (
                  <ChartContainer
                    title={zh ? "利润率周期信号" : "Margin cycle signal"}
                    subtitle={d.cycleSignal.label}
                    footer={zh ? "衍生：产出价格 ÷ 投入成本，指数化" : "Derived: output price ÷ input cost, indexed"}
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
            title={zh ? "什么在驱动这个行业" : "What drives this industry"}
            description={
              zh
                ? "每条驱动因素都是一个可证伪的断言：相位、滞后、弹性。下面并列显示它在真实数据上的检验结果 —— 包括被数据否定的那些。"
                : "Each driver is a falsifiable claim: phase, lag, elasticity. Its backtest against real data is shown alongside — including the ones the data rejects."
            }
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
            title={zh ? "本行业的公司" : "Companies in this industry"}
            description={
              zh
                ? "映射到本行业的覆盖标的成员公司。"
                : "Members of the coverage universe mapped to this industry."
            }
          />
          <Panel className="overflow-hidden">
            <DataTable columnPickerId="industry-compare"
              columns={companyColumns(zh)}
              rows={d.companies}
              getRowId={(c) => c.id}
              searchable
              searchPlaceholder={zh ? "搜索公司" : "Search companies"}
              caption={`${d.name} — ${zh ? "公司" : "companies"}`}
            />
          </Panel>
        </>
      ) : null}
    </DataState>
  );
}
