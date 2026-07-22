/**
 * MOCK knowledge-graph data — P007 v1 UI scaffold. entity/relationship rows;
 * replace with real D1 rows once entity/relationship/relationship_evidence
 * land (docs/design/P007).
 */
export type RelationKind = "supplier" | "customer" | "competitor" | "shareholder" | "partner";

export interface Relation {
  from: string; // ticker
  to: string; // ticker
  kind: RelationKind;
  note: string;
  confidence: "high" | "med" | "low";
}

export const RELATIONS: Relation[] = [
  { from: "HLXC", to: "ARFY", kind: "supplier", note: "ARFY 代工 HLXC 主力芯片", confidence: "high" },
  { from: "HLXC", to: "VTXM", kind: "supplier", note: "VTXM 供应 HBM 存储", confidence: "high" },
  { from: "HLXC", to: "NMBS", kind: "partner", note: "联合参考架构（网络+计算）", confidence: "med" },
  { from: "NMBS", to: "SLPW", kind: "supplier", note: "SLPW 提供机柜级冷却方案", confidence: "med" },
  { from: "HLXC", to: "ARFY", kind: "competitor", note: "先进制程自研 vs 外包路线的潜在竞对关系", confidence: "low" },
];

export const KIND_LABEL: Record<RelationKind, string> = {
  supplier: "供应商",
  customer: "客户",
  competitor: "竞争对手",
  shareholder: "股东",
  partner: "合作伙伴",
};

export const KIND_TONE: Record<RelationKind, "info" | "warning" | "negative" | "accent" | "neutral"> = {
  supplier: "info",
  customer: "accent",
  competitor: "negative",
  shareholder: "warning",
  partner: "neutral",
};

export function relationsFor(ticker: string): Relation[] {
  return RELATIONS.filter((r) => r.from === ticker || r.to === ticker);
}
