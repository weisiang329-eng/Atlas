"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { DataTable, type Column } from "@/components/data/data-table";
import { Sparkline } from "@/components/chart/sparkline";
import { METRICS, type MetricRow } from "@/lib/mock/financials";

const columns: Column<MetricRow>[] = [
  { key: "label", header: "Metric" },
  { key: "latest", header: "Latest", numeric: true },
  {
    key: "trend",
    header: "Trend · FY21–FY24",
    align: "right",
    render: (row) => (
      <Sparkline
        values={row.series}
        ariaLabel={`${row.label} trend`}
      />
    ),
  },
];

export default function FinancialMetricsPage() {
  return (
    <>
      <SectionHeading
        title="Financial metrics"
        description="Key ratios with a micro-trend per metric. Values are sample data — ratios are computed server-side once wired, never in the UI."
      />
      <Panel className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={METRICS}
          getRowId={(r) => r.label}
          caption="Financial metrics, sample data"
        />
      </Panel>
    </>
  );
}
