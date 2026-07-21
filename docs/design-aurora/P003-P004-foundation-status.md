# P003 / P004 — 基座整编 Data Ingestion & Financial Intelligence · Status Doc

> docs/design/P003-P004-foundation-status.md · 整编文档（不重新设计，只写清现状与缺口）

## P003 — 数据摄取与溯源基座（部分已上线）

**已上线**
- SEC EDGAR 自动摄取：10 家 AI 基建公司，最深 19 个财年（年度已跑通，spike 完成）。
- Bursa PDF 来源：7 家大马手套股，2002→2026 共 555 个季度。
- 溯源体系：每个数值挂 source 行，kind: `seed / sec-edgar / glove-tracker / manual / estimate`。

**本轮设计新增的 kind**（各模块文档引入，汇总于此）：
`quote-feed`(P027) · `broker`(P028) · `erp`(P014) · `news`(P022) · `crawler`(P006) ·
`derived`(P010/P012 后端推导值) · `ai-draft`(P020，人审门禁)。

**缺口 → 归属**
- 季度 YTD-diff、IFRS 映射、新闻管道、全自动 Cron → **P022**（本基座的 v2+）。
- 管道可观测与 DQ 巡检 → **P024**。
- 原始文件存档（R2）与 source 回链原文 → P022 v2。

## P004 — 财务智能引擎（进行中，management/programs/P004 为准）

**已上线**：facts(概念→数值) → 三大报表/指标/比率全部后端计算；前端零计算；
财务工作台（overview/income/balance/cash-flow/metrics/ratios/trends/quarterly/annual）
结构完成，StatementTable/ResultsTable/图表容器就绪。

**缺口 → 归属**
- 私企/ERP 财务同构（不仅上市公司）→ 与 **P014** 对齐：erp 财务走同一 facts 概念层。
- 汇率 `Currency/ExchangeRate` 表落地 → P004 剩余 scope（P012/P018 合并视图依赖）。
- 估值/评分消费层 → **P010**；预测/Forecast 列 → P010 v2 DCF 与 P013 报告呈现
  （UI 原型见本项目 `Atlas.dc.html` 损益表页：实际列+预测 E 列的呈现规范）。

**呈现规范（已定，前端遵循）**
- 报表列 = 期间列（历史实际 + 预测 E 列浅金底纹）；负数括号红；section/line/total 三级行；
  单位行注记；缺失 —；数字 `.num` 无点零。

## 依赖与顺序
P003/P004 无需独立立项文档；其余全部模块的「⑤依赖」按本文所列 kind 与缺口归属执行。
