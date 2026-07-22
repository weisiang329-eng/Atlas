import { DataTable, type Column } from "@/components/data/data-table";
import { formatPercent } from "@/lib/format";
import type { IndustryCompareRow } from "@/lib/mock/industries";

const columns: Column<IndustryCompareRow>[] = [
  {
    key: "ticker",
    header: "公司",
    sortable: true,
    render: (r) => (
      <div className="flex flex-col">
        <span className="font-mono text-sm font-semibold text-fg">{r.ticker}</span>
        <span className="text-2xs text-faint">{r.name}</span>
      </div>
    ),
  },
  {
    key: "revenueGrowthPct",
    header: "营收增速 YoY",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.revenueGrowthPct,
    render: (r) => <span className="num text-positive">{formatPercent(r.revenueGrowthPct, 1)}</span>,
  },
  {
    key: "grossMarginPct",
    header: "毛利率",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.grossMarginPct,
    render: (r) => <span className="num">{r.grossMarginPct.toFixed(1)}%</span>,
  },
  {
    key: "utilizationPct",
    header: "稼动率",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.utilizationPct,
    render: (r) => <span className="num">{r.utilizationPct}%</span>,
  },
  {
    key: "marketShare",
    header: "市占率 (est.)",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.marketShare,
    render: (r) => <span className="num text-muted">{(r.marketShare * 100).toFixed(0)}%</span>,
  },
];

export function IndustryCompareTable({ rows }: { rows: IndustryCompareRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.ticker}
      searchable
      searchPlaceholder="Search companies…"
      caption="Industry comparison"
    />
  );
}
