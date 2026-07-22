/**
 * MOCK Stage-4 knowledge/learning data — P021 Memory, P023 Learning.
 * Fictional sample. Replace with memory (D1+Vectorize) and learning_stat rows.
 */
export interface MemoryItem {
  id: string; entity: string; kind: "conclusion" | "profile" | "fact"; text: string; origin: string; createdAt: number;
}
/*
 * MEMORIES was removed with the fake Memory page (P021 is not built).
 * `MemoryItem` is kept as the intended shape for when pgvector lands.
 *
 * Worth remembering why it had to go rather than just being labelled: the
 * entries carried an `origin` — "研究笔记 2026-06", "决策复盘 d2" — so each
 * fabricated conclusion cited a source that does not exist, and one was
 * attributed to 手套行业, a real sector under real coverage. A fake number is
 * bad; a fake number wearing a citation is worse, because the citation is the
 * exact signal a reader uses to decide the number is trustworthy.
 */

export interface LearningStat {
  dim: string; hitRate: number; n: number;
}
export const LEARNING_STATS: LearningStat[] = [
  { dim: "全部决策", hitRate: 0.64, n: 25 },
  { dim: "半导体", hitRate: 0.71, n: 14 },
  { dim: "手套", hitRate: 0.55, n: 7 },
  { dim: "其他", hitRate: 0.5, n: 4 },
];
