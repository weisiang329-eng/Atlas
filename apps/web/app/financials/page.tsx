import { SectionHeading } from "@/components/ui/section-heading";
import { Stat } from "@/components/ui/stat";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import { BarSeries } from "@/components/chart/bar-series";
import { StateShowcase } from "@/components/ui/state-showcase";
import { TREND_REVENUE, TREND_NET_INCOME } from "@/lib/mock/financials";

export default function FinancialOverviewPage() {
  return (
    <>
      <SectionHeading
        title="Overview"
        description="Headline figures and trends for the selected subject. Sample data — no calculations are performed in the UI."
      />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border lg:grid-cols-4">
        {[
          { label: "Revenue (FY24)", value: "21,000", hint: "USD millions" },
          { label: "Operating income", value: "8,250", hint: "USD millions" },
          { label: "Net income", value: "6,910", hint: "USD millions" },
          { label: "Free cash flow", value: "5,350", hint: "USD millions" },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <Stat label={s.label} value={s.value} hint={s.hint} />
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
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
          <BarSeries data={TREND_NET_INCOME} ariaLabel="Annual net income" />
        </ChartContainer>
      </div>

      <StateShowcase />
    </>
  );
}
