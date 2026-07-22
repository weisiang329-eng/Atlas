"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { StatGrid } from "@/components/ui/stat-grid";
import { ChartContainer } from "@/components/chart/chart-container";
import { BarSeries } from "@/components/chart/bar-series";
import { DataTable, type Column } from "@/components/data/data-table";
import { formatCompact, formatNumber } from "@/lib/format";
import { SampleDataNotice } from "@/components/ui/sample-data-notice";
import {
  ERP_REVENUE_BY_MONTH,
  ERP_CUSTOMERS,
  ERP_SKUS,
  CUSTOMER_HHI,
  type CustomerRow,
  type SkuRow,
} from "@/lib/mock/erp";

const customerCols: Column<CustomerRow>[] = [
  { key: "name", header: "客户", sortable: true },
  { key: "segment", header: "渠道", className: "text-muted" },
  { key: "revenue", header: "收入", numeric: true, sortable: true, sortAccessor: (r) => r.revenue, render: (r) => <span className="num">{formatNumber(r.revenue)}</span> },
  { key: "sharePct", header: "占比", numeric: true, sortable: true, sortAccessor: (r) => r.sharePct, render: (r) => <span className="num text-muted">{r.sharePct.toFixed(1)}%</span> },
];

const skuCols: Column<SkuRow>[] = [
  { key: "name", header: "SKU", sortable: true, render: (r) => <div className="flex flex-col"><span className="text-sm text-fg">{r.name}</span><span className="text-2xs text-faint">{r.category}</span></div> },
  { key: "revenue", header: "收入", numeric: true, sortable: true, sortAccessor: (r) => r.revenue, render: (r) => <span className="num">{formatNumber(r.revenue)}</span> },
  {
    key: "grossMarginPct",
    header: "毛利率",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.grossMarginPct,
    render: (r) => <span className={`num ${r.grossMarginPct < 20 ? "text-negative" : "text-fg"}`}>{r.grossMarginPct.toFixed(1)}%</span>,
  },
];

export default function ErpFurniturePage() {
  const totalRev = ERP_CUSTOMERS.reduce((a, c) => a + c.revenue, 0);
  return (
    <>
      <SampleDataNotice reason="Requires the 晨光家具 sales and SKU tables to be ingested." />
      <SectionHeading title="晨光家具 · 经营情报" description="收入结构、客户集中度与 SKU 毛利。所有聚合后端算好，UI 零计算。" />

      <div className="mb-6">
        <StatGrid
          items={[
            { label: "近半年收入", value: formatCompact(ERP_REVENUE_BY_MONTH.reduce((a, m) => a + m.value, 0)) },
            { label: "客户数", value: String(ERP_CUSTOMERS.length) },
            { label: "客户集中度 HHI", value: String(CUSTOMER_HHI), hint: CUSTOMER_HHI > 2500 ? "偏高" : "适中" },
            { label: "SKU 数", value: String(ERP_SKUS.length) },
          ]}
        />
      </div>

      <div className="mb-6">
        <ChartContainer title="收入结构 · 按月" subtitle="近 6 个月" height={180}>
          <BarSeries data={ERP_REVENUE_BY_MONTH} ariaLabel="Revenue by month" height={180} />
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="客户集中度" subtitle={`Top ${ERP_CUSTOMERS.length} · 合计 ${formatCompact(totalRev)}`}>
          <DataTable columnPickerId="erp-furniture"
        mobileCards columns={customerCols} rows={ERP_CUSTOMERS} getRowId={(r) => r.id} caption="Customer concentration" />
        </ChartContainer>
        <ChartContainer title="SKU 毛利" subtitle="按收入排序，毛利率 <20% 标红">
          <DataTable columns={skuCols} rows={ERP_SKUS} getRowId={(r) => r.id} searchable searchPlaceholder="Search SKU…" caption="SKU margin" />
        </ChartContainer>
      </div>
    </>
  );
}
