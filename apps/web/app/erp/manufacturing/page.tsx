import { SectionHeading } from "@/components/ui/section-heading";
import { StatGrid } from "@/components/ui/stat-grid";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import { MFG_KPIS, MFG_UTILIZATION_TREND } from "@/lib/mock/erp-ops";

export default function ManufacturingPage() {
  return (
    <>
      <SectionHeading title="制造情报 P015" description="产能/稼动率/良率/交期，与行业对标同构（自家 vs P006 行业指标）。" />
      <div className="mb-6">
        <StatGrid
          items={[
            { label: "稼动率 Utilization", value: `${MFG_KPIS.utilization}%` },
            { label: "良率 Yield", value: `${MFG_KPIS.yield}%` },
            { label: "交期达成 OTD", value: `${MFG_KPIS.otd}%` },
            { label: "本月产量", value: MFG_KPIS.output.toLocaleString("en-US") },
          ]}
        />
      </div>
      <ChartContainer title="稼动率趋势" subtitle="近 6 月 · 自家产线（对标行业稼动率见 P006）" height={200}>
        <TrendChart data={MFG_UTILIZATION_TREND} ariaLabel="Utilization trend" glow gradientId="mfg-util" height={200} />
      </ChartContainer>
    </>
  );
}
