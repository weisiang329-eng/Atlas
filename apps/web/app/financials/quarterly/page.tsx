import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/chart/chart-container";
import { BarSeries } from "@/components/chart/bar-series";
import { ResultsTable } from "@/components/data/results-table";
import { QUARTERLY_RESULTS } from "@/lib/mock/financials";

export const metadata: Metadata = { title: "Quarterly Results" };

const recent = QUARTERLY_RESULTS.slice(0, 8)
  .map((r) => ({ label: r.period.replace(" FY", "'"), value: r.revenue }))
  .reverse();

export default function QuarterlyResultsPage() {
  return (
    <>
      <SectionHeading
        title="Quarterly results"
        description="Reported quarters, most recent first. Synthetic sample set demonstrates paginated large-dataset rendering."
        action={<Badge tone="neutral">{QUARTERLY_RESULTS.length} quarters</Badge>}
      />

      <div className="mb-6">
        <ChartContainer
          title="Revenue by quarter"
          subtitle="Last 8 quarters · USD millions"
          footer="Illustrative sample data"
        >
          <BarSeries data={recent} ariaLabel="Revenue by quarter" />
        </ChartContainer>
      </div>

      <Panel className="overflow-hidden">
        <ResultsTable
          rows={QUARTERLY_RESULTS}
          pageSize={12}
          caption="Quarterly results, sample data, paginated"
        />
      </Panel>
    </>
  );
}
