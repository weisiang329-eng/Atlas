# P013 — 报告自动化 Report Automation · Design

> docs/design/P013-report-automation-design.md · v1 草案

## ① 使命与决策问题

用 ReportLayout 的 9 种报告块，从**真数据**自动生成公司报告/行业报告/周报，可导出：
**给自己和董事会的成品文档。** 报告是决策文档（What changed / Why / Who / Evidence / Next），
不是导出美化。

## ② 功能清单

**v1**
- 报告生成器（模板驱动，无 AI）：company-report / industry-report / weekly-brief 三模板，
  从 P004/P005/P006/P009/P010 endpoints 取数拼装 `ReportModel`。
  验收：/reports 列表出现生成的报告；打印（现有 print 样式）出干净 PDF；每数值带 source。
- 版本与状态：Draft → In review → Final（模型已有 status 字段）；重生成产生新版本。
**v2**
- 定时生成（周报每周一 07:00，经 P024 Cron）；导出到 R2（PDF 归档）+ 下载链接；
  周报含「未复盘决策」「本周告警 Top」区块。
**v3**
- AI 草稿（P020 agent 按节生成，claim 带 source——Evidence 表是可审计契约）；人审门禁维持。

## ③ 后端

**D1 表**
```
report(id PK, type slug, title, subject_kind, subject_id, status 'draft'|'review'|'final',
       version INT, model_json TEXT, created_at, created_by)  INDEX(type,subject_id,version)
```
（model_json = ReportModel 全量，与前端 `lib/mock/reports.ts` 的类型对齐成正式契约）

**/v1/ endpoints**
```
GET  /v1/reports?type=&subject=            → { reports: ReportSummary[] }
GET  /v1/reports/:id                       → { report: ReportModel }
POST /v1/reports/generate                  → { report }    // {type, subjectId, periods?}
POST /v1/reports/:id/status                → { report }
```

**domain 引擎**：`reportComposer(type,subject)`——每模板一个 section pipeline
（exec summary ← KPI 聚合；findings ← 变化检测（本期 vs 上期指标 Δ 超阈值即 finding）；
evidence ← 引用的 fact/source 行；risks ← P006 信号 + P011 未决告警）。无 LLM，纯规则拼装。
**CF 组件**：v2 Cron + R2。

## ④ 前端

**路由树**（已有骨架填实）
```
/reports              报告库（FilterBar: 类型/主体/状态）
/reports/[id]         文档（ReportLayout 全套 + ExportToolbar）
/reports/new          生成表单（类型→主体→期间 → 生成）
```
**区块布局**：全部复用 `ReportLayout` 与 9 报告块；生成表单 = 三步 Dialog。
**loader 四态**：生成中 loading=「正在从 N 个数据源拼装…」骨架；失败 error 给出缺数据的节清单。
**交互**：状态流转按钮（review→final 需确认）；打印按钮走现有 print 体系。

## ⑤ 依赖

- 吃：P004/P005/P006/P009/P010/P011 endpoints；ReportModel 类型（现 mock 转正）。
- 被吃：P019（董事会包复用 composer）、P024（定时）。
- 可独立上线：v1 可以（上游任一就绪的模板先开）。
- 需改：`lib/mock/reports.ts` 类型抽到 `lib/types.ts` 正式契约，mock 报告退役为 seed。

## ⑥ 数据来源与 source.kind

全部引用上游 source；报告自身 derived；AI 草稿（v3）kind: `ai-draft`（新增，必须人审转 final）。

## ⑦ 风险与 stop conditions

- 报告数据陈旧 → 每报告头部显示「数据截至」+ 重生成按钮；**stop**：引用数据缺 source 的节直接不渲染并列缺口。
- v3 AI 幻觉 → Evidence 表硬门禁：无 source 的 claim 不进 Final；人审必经。
