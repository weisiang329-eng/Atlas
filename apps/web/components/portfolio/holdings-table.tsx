"use client";

import { DataTable, type Column } from "@/components/data/data-table";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MOCK_HOLDINGS, type MockHolding } from "@/lib/mock/portfolio";

export interface HoldingRow extends MockHolding {
  marketValue: number;
  costBasis: number;
  unrealized: number;
  unrealizedPct: number;
  weightPct: number;
}

export function computeHoldingRows(holdings: MockHolding[]): HoldingRow[] {
  const marketValues = holdings.map((h) => h.qty * h.price);
  const total = marketValues.reduce((a, v) => a + v, 0) || 1;
  return holdings.map((h, i) => {
    const marketValue = marketValues[i]!;
    const costBasis = h.qty * h.avgCost;
    const unrealized = marketValue - costBasis;
    return {
      ...h,
      marketValue,
      costBasis,
      unrealized,
      unrealizedPct: costBasis !== 0 ? (unrealized / costBasis) * 100 : 0,
      weightPct: (marketValue / total) * 100,
    };
  });
}

const columns: Column<HoldingRow>[] = [
  {
    key: "ticker",
    header: "资产",
    sortable: true,
    render: (h) => (
      <div className="flex flex-col">
        <span className="font-mono text-sm font-semibold text-fg">{h.ticker}</span>
        <span className="text-2xs text-faint">{h.name} · {h.assetClass}</span>
      </div>
    ),
  },
  {
    key: "marketValue",
    header: "市值",
    numeric: true,
    sortable: true,
    sortAccessor: (h) => h.marketValue,
    render: (h) => <span className="num">{formatCurrency(h.marketValue, h.currency)}</span>,
  },
  {
    key: "weightPct",
    header: "权重",
    numeric: true,
    sortable: true,
    sortAccessor: (h) => h.weightPct,
    render: (h) => <span className="num text-muted">{h.weightPct.toFixed(1)}%</span>,
  },
  {
    key: "costBasis",
    header: "成本",
    numeric: true,
    sortable: true,
    sortAccessor: (h) => h.costBasis,
    render: (h) => <span className="num text-muted">{formatNumber(h.costBasis)}</span>,
  },
  {
    key: "unrealized",
    header: "未实现盈亏",
    numeric: true,
    sortable: true,
    sortAccessor: (h) => h.unrealized,
    render: (h) => (
      <div className="flex flex-col items-end">
        <span className={cn("num", h.unrealized >= 0 ? "text-positive" : "text-negative")}>
          {formatNumber(h.unrealized)}
        </span>
        <span className={cn("num text-2xs", h.unrealizedPct >= 0 ? "text-positive" : "text-negative")}>
          {formatPercent(h.unrealizedPct, 1)}
        </span>
      </div>
    ),
  },
];

export function HoldingsTable() {
  const rows = computeHoldingRows(MOCK_HOLDINGS);
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.ticker}
      searchable
      searchPlaceholder="Search holdings…"
      caption="Portfolio holdings"
    />
  );
}
