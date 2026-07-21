/**
 * MOCK Stage-4 knowledge/learning data — P021 Memory, P023 Learning.
 * Fictional sample. Replace with memory (D1+Vectorize) and learning_stat rows.
 */
export interface MemoryItem {
  id: string; entity: string; kind: "conclusion" | "profile" | "fact"; text: string; origin: string; createdAt: number;
}
export const MEMORIES: MemoryItem[] = [
  { id: "m1", entity: "HLXC", kind: "conclusion", text: "HLXC 的护城河在软件生态而非单纯算力，价格战对其毛利影响有限。", origin: "研究笔记 2026-06", createdAt: Date.now() - 20 * 24 * 3600e3 },
  { id: "m2", entity: "手套行业", kind: "conclusion", text: "手套周期见底信号需同时看 ASP 环比转正 + 稼动率回升，单一指标易误判。", origin: "决策复盘 d2", createdAt: Date.now() - 15 * 24 * 3600e3 },
  { id: "m3", entity: "VTXM", kind: "profile", text: "存储纯周期股，业绩弹性大但可预测性低，仓位应小而灵活。", origin: "研究笔记 2026-05", createdAt: Date.now() - 40 * 24 * 3600e3 },
];

export interface LearningStat {
  dim: string; hitRate: number; n: number;
}
export const LEARNING_STATS: LearningStat[] = [
  { dim: "全部决策", hitRate: 0.64, n: 25 },
  { dim: "半导体", hitRate: 0.71, n: 14 },
  { dim: "手套", hitRate: 0.55, n: 7 },
  { dim: "其他", hitRate: 0.5, n: 4 },
];
