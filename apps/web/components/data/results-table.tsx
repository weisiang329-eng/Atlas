"use client";

import { DataTable, type Column } from "@/components/data/data-table";
import type { ResultRow } from "@/lib/mock/financials";

const num = (v: number) => v.toLocaleString("en-US");

const columns: Column<ResultRow>[] = [
  { key: "period", header: "Period", sortable: true },
  { key: "revenue", header: "Revenue", numeric: true, sortable: true, render: (r) => num(r.revenue) },
  {
    key: "grossProfit",
    header: "Gross profit",
    numeric: true,
    sortable: true,
    render: (r) => num(r.grossProfit),
  },
  {
    key: "operatingIncome",
    header: "Operating income",
    numeric: true,
    sortable: true,
    render: (r) => num(r.operatingIncome),
  },
  {
    key: "netIncome",
    header: "Net income",
    numeric: true,
    sortable: true,
    render: (r) => num(r.netIncome),
  },
  {
    key: "eps",
    header: "EPS",
    numeric: true,
    sortable: true,
    render: (r) => r.eps.toFixed(2),
  },
];

/**
 * Results table (period rows × standard columns). Encapsulates the column
 * definitions so the render functions stay on the client while pages can remain
 * server components that just hand over rows.
 */
export function ResultsTable({
  rows,
  pageSize,
  caption,
}: {
  rows: ResultRow[];
  pageSize?: number;
  caption?: string;
}) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      pageSize={pageSize}
      caption={caption}
    />
  );
}
