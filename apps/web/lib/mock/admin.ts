/**
 * MOCK platform admin data — P025 Atlas 1.0 (users + audit log). Auth is
 * Cloudflare Access in the real system; roles gate module access double-sided
 * (UI + API). Fictional sample rows.
 */
export interface UserRow {
  id: string; name: string; email: string; role: "owner" | "analyst" | "viewer"; enabled: boolean;
}
export const USERS: UserRow[] = [
  { id: "u1", name: "Cheng Wei", email: "owner@atlas.local", role: "owner", enabled: true },
  { id: "u2", name: "研究助理 A", email: "analyst.a@atlas.local", role: "analyst", enabled: true },
  { id: "u3", name: "外部顾问", email: "viewer@atlas.local", role: "viewer", enabled: false },
];

export interface AuditRow {
  id: string; actor: string; action: string; entity: string; at: number;
}
export const AUDIT_LOG: AuditRow[] = [
  { id: "a1", actor: "owner", action: "order.confirm", entity: "order/o1 (paper)", at: Date.now() - 3 * 24 * 3600e3 },
  { id: "a2", actor: "owner", action: "decision.close", entity: "decision/d2", at: Date.now() - 2 * 24 * 3600e3 },
  { id: "a3", actor: "analyst.a", action: "report.generate", entity: "report/board-pack", at: Date.now() - 26 * 3600e3 },
  { id: "a4", actor: "owner", action: "risk_rule.update", entity: "risk/max-order-value", at: Date.now() - 10 * 3600e3 },
];
