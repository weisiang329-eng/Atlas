/**
 * MOCK Stage-4 ops data — P020 Agent Runtime, P022 Ingest, P024 Automation.
 * Fictional sample. Replace with agent_task / ingest_pipeline / automation_job
 * D1 rows once those backends land.
 */
export interface AgentTask {
  id: string; kind: string; status: "queued" | "running" | "done" | "failed"; tokens: number; ms: number; createdAt: number;
}
export const AGENT_TASKS: AgentTask[] = [
  { id: "t1", kind: "公司季度变化摘要 · HLXC", status: "done", tokens: 4820, ms: 12400, createdAt: Date.now() - 3600e3 },
  { id: "t2", kind: "行业周期信号复核 · 手套", status: "running", tokens: 1200, ms: 5200, createdAt: Date.now() - 300e3 },
  { id: "t3", kind: "组合暴露传导分析", status: "queued", tokens: 0, ms: 0, createdAt: Date.now() - 60e3 },
  { id: "t4", kind: "新闻实体抽取 · 批量", status: "failed", tokens: 800, ms: 2100, createdAt: Date.now() - 7200e3 },
];

export interface IngestPipeline {
  id: string; kind: string; schedule: string; lastRun: number; ok: boolean; rows: number;
}
export const INGEST_PIPELINES: IngestPipeline[] = [
  { id: "p1", kind: "EDGAR 年度 (10-K)", schedule: "daily 06:00", lastRun: Date.now() - 6 * 3600e3, ok: true, rows: 19 },
  { id: "p2", kind: "EDGAR 季度 (10-Q YTD-diff)", schedule: "daily 06:00", lastRun: Date.now() - 6 * 3600e3, ok: true, rows: 4 },
  { id: "p3", kind: "IFRS 映射 (ARFY/VTXM · fictional sample)", schedule: "manual", lastRun: Date.now() - 48 * 3600e3, ok: true, rows: 2 },
  { id: "p4", kind: "Bursa 手套 PDF", schedule: "quarterly", lastRun: Date.now() - 12 * 24 * 3600e3, ok: false, rows: 0 },
];

export interface AutomationJob {
  id: string; module: string; schedule: string; lastOk: boolean; lastRun: number;
}
export const AUTOMATION_JOBS: AutomationJob[] = [
  { id: "j1", module: "P011 规则引擎", schedule: "*/5 min", lastOk: true, lastRun: Date.now() - 4 * 60e3 },
  { id: "j2", module: "P012 组合指标日更", schedule: "daily 17:10", lastOk: true, lastRun: Date.now() - 20 * 3600e3 },
  { id: "j3", module: "P006 商品爬虫", schedule: "hourly", lastOk: true, lastRun: Date.now() - 40 * 60e3 },
  { id: "j4", module: "P013 周报生成", schedule: "Mon 07:00", lastOk: true, lastRun: Date.now() - 3 * 24 * 3600e3 },
  { id: "j5", module: "P027 收盘价补录", schedule: "daily 16:10", lastOk: false, lastRun: Date.now() - 22 * 3600e3 },
];
