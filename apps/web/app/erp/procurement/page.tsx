import { SectionHeading } from "@/components/ui/section-heading";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { PROC_PRICE, SUPPLIERS, type SupplierRow } from "@/lib/mock/erp-ops";

const RISK_TONE = { "single-source": "negative", "price-drift": "warning", none: "positive" } as const;
const RISK_LABEL = { "single-source": "单一来源", "price-drift": "价差漂移", none: "正常" } as const;

const cols: Column<SupplierRow>[] = [
  { key: "name", header: "供应商", sortable: true, render: (r) => <div className="flex flex-col"><span className="text-sm text-fg">{r.name}</span><span className="text-2xs text-faint">{r.category}</span></div> },
  { key: "share", header: "采购份额", numeric: true, sortable: true, sortAccessor: (r) => r.share, render: (r) => <span className="num">{r.share}%</span> },
  { key: "otd", header: "准时率", numeric: true, sortable: true, sortAccessor: (r) => r.otd, render: (r) => <span className={`num ${r.otd < 85 ? "text-negative" : "text-fg"}`}>{r.otd}%</span> },
  { key: "risk", header: "风险", render: (r) => <Badge tone={RISK_TONE[r.risk]}>{RISK_LABEL[r.risk]}</Badge> },
];

export default function ProcurementPage() {
  return (
    <>
      <SectionHeading title="采购供应链 P016" description="采购价 vs 大宗曲线对标、供应商表现与断供风险。" />
      <div className="mb-6">
        <ChartContainer title="采购价 vs 大宗代理曲线" subtitle="指数化 (1月=100) · 采购价滞后于原料上涨" height={200}>
          <div className="relative">
            <TrendChart data={PROC_PRICE} ariaLabel="Purchase price" glow gradientId="proc-price" height={200} />
          </div>
        </ChartContainer>
        <p className="mt-2 text-2xs text-faint">
          金色 = 采购价；对标大宗序列（灰虚线）在完整实现中叠加于同图（v2，复用多序列 TrendChart）。当前采购价涨幅 16% vs 大宗 21%，存在议价空间。
        </p>
      </div>
      <ChartContainer title="供应商" subtitle="份额 / 准时率 / 风险标记">
        <DataTable columns={cols} rows={SUPPLIERS} getRowId={(r) => r.id} caption="Suppliers" />
      </ChartContainer>
    </>
  );
}
