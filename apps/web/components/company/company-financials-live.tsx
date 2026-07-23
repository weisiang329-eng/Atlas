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
import { useLocale } from "@/lib/i18n/use-locale";
import { isApiConfigured } from "@/lib/api/client";
import type { CompanyFinancials, MetricRow } from "@/lib/types";

export function CompanyFinancialsLive({ companyId }: { companyId: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const live = isApiConfigured();
  const r = useApiResource<CompanyFinancials>(
    live ? `/v1/companies/${companyId}/financials` : null,
  );

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

  if (!live) {
    return (
      <>
        <SectionHeading
          title={zh ? "财务" : "Financials"}
          description={
            zh
              ? "报告的财务报表与衍生指标，由财务智能引擎计算。"
              : "Reported statements and derived metrics, computed by the Financial Intelligence Engine."
          }
        />
        <EmptyState
          title={zh ? "API 未配置" : "API not configured"}
          body={
            zh
              ? "在构建时设置 NEXT_PUBLIC_API_BASE_URL 以加载本公司的实时财务数据。"
              : "Set NEXT_PUBLIC_API_BASE_URL at build time to load this company's live financials."
          }
        />
      </>
    );
  }

  return (
    <>
      <SectionHeading
        title={zh ? "财务" : "Financials"}
        description={
          zh
            ? "报告的财务报表与衍生指标，由财务智能引擎计算。"
            : "Reported statements and derived metrics, computed by the Financial Intelligence Engine."
        }
      />
      <DataState
        status={r.status}
        empty={
          <EmptyState
            title={zh ? "暂无财务覆盖" : "No financial coverage yet"}
            body={
              zh
                ? "本公司已在覆盖范围内，但尚无已录入的报告期。覆盖范围将随数据接入而增长（P022）。"
                : "This company is in the universe but has no seeded periods. Coverage grows with ingestion (P022)."
            }
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
                caption={zh ? "利润表，年度" : "Income statement, annual"}
              />
            </Panel>
            <Panel className="overflow-hidden">
              <DataTable
                columns={metricColumns}
                rows={r.data.metrics}
                getRowId={(row) => row.label}
                caption={zh ? "关键指标" : "Key metrics"}
              />
            </Panel>
          </div>
        ) : null}
      </DataState>
    </>
  );
}
