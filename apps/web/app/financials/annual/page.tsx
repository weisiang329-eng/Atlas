import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/chart/chart-container";
import { BarSeries } from "@/components/chart/bar-series";
import { ResultsTable } from "@/components/data/results-table";
import { ANNUAL_RESULTS } from "@/lib/mock/financials";

export const metadata: Metadata = { title: "Annual Results" };

const byYear = ANNUAL_RESULTS.map((r) => ({
  label: r.period,
  value: r.revenue,
})).reverse();

export default function AnnualResultsPage() {
  return (
    <>
      <SectionHeading
        title="Annual results"
        description="Full-year results across the coverage window. Sample data."
        action={<Badge tone="neutral">{ANNUAL_RESULTS.length} years</Badge>}
      />

      <div className="mb-6">
        <ChartContainer
          title="Revenue by year"
          subtitle="USD millions"
          footer="Illustrative sample data"
        >
          <BarSeries data={byYear} ariaLabel="Revenue by year" />
        </ChartContainer>
      </div>

      <Panel className="overflow-hidden">
        <ResultsTable
          rows={ANNUAL_RESULTS}
          pageSize={10}
          caption="Annual results, sample data"
        />
      </Panel>
    </>
  );
}
