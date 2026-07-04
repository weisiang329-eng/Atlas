import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import {
  TREND_REVENUE,
  TREND_NET_INCOME,
  TREND_FCF,
} from "@/lib/mock/financials";

export const metadata: Metadata = { title: "Historical Trends" };

export default function HistoricalTrendsPage() {
  return (
    <>
      <SectionHeading
        title="Historical trends"
        description="Multi-year trajectory across the core statements. Sample data."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Revenue"
          subtitle="Annual · USD millions"
          footer="Illustrative sample data"
        >
          <TrendChart data={TREND_REVENUE} ariaLabel="Annual revenue trend" />
        </ChartContainer>
        <ChartContainer
          title="Net income"
          subtitle="Annual · USD millions"
          footer="Illustrative sample data"
        >
          <TrendChart
            data={TREND_NET_INCOME}
            ariaLabel="Annual net income trend"
          />
        </ChartContainer>
        <ChartContainer
          title="Free cash flow"
          subtitle="Annual · USD millions"
          footer="Illustrative sample data"
        >
          <TrendChart data={TREND_FCF} ariaLabel="Annual free cash flow trend" />
        </ChartContainer>
        <ChartContainer
          title="Coverage"
          subtitle="Awaiting data"
          status="empty"
        >
          <div />
        </ChartContainer>
      </div>
    </>
  );
}
