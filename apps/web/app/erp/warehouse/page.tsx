"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { StatGrid } from "@/components/ui/stat-grid";
import { ChartContainer } from "@/components/chart/chart-container";
import { DataTable, type Column } from "@/components/data/data-table";
import { formatCompact, formatNumber } from "@/lib/format";
import { WH_KPIS, DEADSTOCK, type DeadstockRow } from "@/lib/mock/erp-ops";

const cols: Column<DeadstockRow>[] = [
  { key: "sku", header: "SKU", sortable: true },
  { key: "value", header: "压货金额", numeric: true, sortable: true, sortAccessor: (r) => r.value, render: (r) => <span className="num">{formatNumber(r.value)}</span> },
  { key: "days", header: "无动销天数", numeric: true, sortable: true, sortAccessor: (r) => r.days, render: (r) => <span className="num text-negative">{r.days}</span> },
];

export default function WarehousePage() {
  return (
    <>
      <SectionHeading title="仓储运营 P017" description="库存天数、周转与呆滞品——现金流视角看库存。" />
      <div className="mb-6">
        <StatGrid
          items={[
            { label: "库存总值", value: formatCompact(WH_KPIS.totalValue) },
            { label: "库存天数 DIO", value: String(WH_KPIS.dio) },
            { label: "周转次数", value: `${WH_KPIS.turns}x` },
            { label: "呆滞品金额", value: formatCompact(WH_KPIS.deadstockValue), hint: "占比 11%" },
          ]}
        />
      </div>
      <ChartContainer title="呆滞品清单" subtitle="超过 90 天无动销，按金额排序">
        <DataTable columns={cols} rows={DEADSTOCK} getRowId={(r) => r.id} caption="Deadstock" />
      </ChartContainer>
    </>
  );
}
