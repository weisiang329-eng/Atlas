import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MOCK_ORDERS, type MockOrder, type OrderStatus } from "@/lib/mock/trading";

const STATUS_TONE: Record<OrderStatus, "positive" | "info" | "negative" | "neutral" | "warning"> = {
  draft: "neutral",
  confirmed: "info",
  sent: "info",
  filled: "positive",
  rejected: "negative",
  cancelled: "neutral",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "草稿",
  confirmed: "已确认",
  sent: "已送出",
  filled: "已成交",
  rejected: "被拒绝",
  cancelled: "已撤销",
};

const columns: Column<MockOrder>[] = [
  {
    key: "ticker",
    header: "品种",
    sortable: true,
    render: (o) => <span className="font-mono text-sm font-semibold text-fg">{o.ticker}</span>,
  },
  {
    key: "side",
    header: "方向",
    render: (o) => <span className={o.side === "buy" ? "text-positive" : "text-negative"}>{o.side === "buy" ? "买入" : "卖出"}</span>,
  },
  { key: "qty", header: "数量", numeric: true, sortable: true, sortAccessor: (o) => o.qty },
  { key: "type", header: "类型", render: (o) => (o.type === "market" ? "市价" : `限价 ${o.limitPrice}`) },
  {
    key: "estValue",
    header: "预估金额",
    numeric: true,
    sortable: true,
    sortAccessor: (o) => o.estValue,
    render: (o) => <span className="num">{formatCurrency(o.estValue)}</span>,
  },
  { key: "status", header: "状态", render: (o) => <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge> },
  { key: "createdAt", header: "时间", render: (o) => <span className="text-2xs text-faint">{formatDateTime(o.createdAt)}</span> },
];

export function OrdersTable() {
  return <DataTable columns={columns} rows={MOCK_ORDERS} getRowId={(o) => o.id} caption="Orders" />;
}
