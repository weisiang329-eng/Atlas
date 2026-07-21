/**
 * MOCK watchlist + alerts data — P011 v1 UI scaffold. Same convention as
 * lib/mock/markets.ts: fictional tickers, clearly labelled, replace wholesale
 * when watchlist_item/alert_rule/alert (D1) land per P011 design doc.
 */
export interface WatchlistGroup {
  id: string;
  name: string;
  tickers: string[];
}

export const WATCHLIST_GROUPS: WatchlistGroup[] = [
  { id: "ai-infra", name: "AI 基建", tickers: ["HLXC", "ARFY", "VTXM", "NMBS", "SLPW"] },
  { id: "gloves", name: "手套 Gloves", tickers: ["MRGV"] },
];

export type AlertSeverity = "info" | "warning" | "critical";

export interface MockAlert {
  id: string;
  ruleKind: "price-cross" | "day-move" | "52w-distance" | "earnings-near" | "decision-due";
  severity: AlertSeverity;
  title: string;
  detail: string;
  ticker?: string;
  firedAt: number;
  read: boolean;
}

const now = Date.now();

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: "a1",
    ruleKind: "day-move",
    severity: "critical",
    title: "HLXC 单日涨幅 > 5%",
    detail: "Helios Compute Corp 触发单日涨跌阈值：+6.4%（阈值 5%）",
    ticker: "HLXC",
    firedAt: now - 8 * 60 * 1000,
    read: false,
  },
  {
    id: "a2",
    ruleKind: "52w-distance",
    severity: "warning",
    title: "VTXM 接近 52 周低点",
    detail: "距 52 周低点仅 2.1%（阈值 3%）",
    ticker: "VTXM",
    firedAt: now - 42 * 60 * 1000,
    read: false,
  },
  {
    id: "a3",
    ruleKind: "earnings-near",
    severity: "info",
    title: "NMBS 财报将于 5 天后公布",
    detail: "Q2 财报预计 2026-07-26 盘后公布",
    ticker: "NMBS",
    firedAt: now - 3 * 60 * 60 * 1000,
    read: true,
  },
  {
    id: "a4",
    ruleKind: "decision-due",
    severity: "warning",
    title: "决策待复盘：ARFY 建仓判断到期",
    detail: "2026-07-15 记录的判断已到复盘期限",
    ticker: "ARFY",
    firedAt: now - 26 * 60 * 60 * 1000,
    read: true,
  },
  {
    id: "a5",
    ruleKind: "price-cross",
    severity: "info",
    title: "MRGV 价格穿越 RM2.10",
    detail: "延迟报价（15 分钟）：MRGV 上穿 RM2.10 关注位",
    ticker: "MRGV",
    firedAt: now - 2 * 24 * 60 * 60 * 1000,
    read: true,
  },
];
