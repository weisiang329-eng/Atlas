/**
 * MOCK trading data — P028 v1 UI scaffold, PAPER mode only. Replace with real
 * order/fill/position_snapshot D1 rows once the trading-bridge lands. The
 * confirm-then-send flow here mirrors the real contract: draft → confirm →
 * (bridge) sent → filled — never auto-executed.
 */
export type OrderStatus = "draft" | "confirmed" | "sent" | "filled" | "rejected" | "cancelled";

export interface MockOrder {
  id: string;
  ticker: string;
  side: "buy" | "sell";
  qty: number;
  type: "market" | "limit";
  limitPrice?: number;
  estValue: number;
  status: OrderStatus;
  createdAt: number;
}

export const MOCK_ORDERS: MockOrder[] = [
  { id: "o1", ticker: "HLXC", side: "buy", qty: 50, type: "market", estValue: 8620, status: "filled", createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
  { id: "o2", ticker: "VTXM", side: "sell", qty: 120, type: "limit", limitPrice: 120, estValue: 14400, status: "filled", createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  { id: "o3", ticker: "NMBS", side: "buy", qty: 20, type: "limit", limitPrice: 238, estValue: 4760, status: "rejected", createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
];

export const RISK_RULES = {
  maxOrderValue: 50000,
  dailyMaxValue: 150000,
  tickerAllowlist: ["HLXC", "ARFY", "VTXM", "NMBS", "SLPW"], // MRGV (Bursa) excluded — signal only, no order API
};
