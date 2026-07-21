/**
 * MOCK board intelligence data — P019 v1 UI scaffold. Risk register + meetings.
 * Replace with risk_register/board_meeting D1 rows (docs/design/P019).
 */
export interface RiskItem {
  id: string;
  title: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  owner: string;
  status: "open" | "mitigating" | "closed";
}

export const RISK_REGISTER: RiskItem[] = [
  { id: "r1", title: "AI 芯片供给集中于单一代工厂", likelihood: 3, impact: 5, owner: "投资", status: "mitigating" },
  { id: "r2", title: "手套 ASP 持续下行侵蚀毛利", likelihood: 4, impact: 3, owner: "行业研究", status: "open" },
  { id: "r3", title: "家具出口汇率敞口 (USDMYR)", likelihood: 3, impact: 3, owner: "CEO", status: "mitigating" },
  { id: "r4", title: "餐饮 ERP 数据同步不稳定", likelihood: 2, impact: 2, owner: "IT", status: "open" },
  { id: "r5", title: "组合过度集中于半导体板块", likelihood: 4, impact: 4, owner: "投资", status: "open" },
];

export interface BoardMeeting {
  id: string;
  date: string;
  agenda: string[];
  packStatus: "draft" | "review" | "final";
}

export const BOARD_MEETINGS: BoardMeeting[] = [
  { id: "m1", date: "2026-07-15", agenda: ["组合表现回顾", "半导体集中度", "手套周期判断"], packStatus: "final" },
  { id: "m2", date: "2026-10-15", agenda: ["Q3 经营回顾", "家具出口对策", "自动化路线图"], packStatus: "draft" },
];
