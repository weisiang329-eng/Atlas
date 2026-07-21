# P019 — 董事会情报 Board Intelligence · Design

> docs/design/P019-board-intelligence-design.md · v1 草案

## ① 使命与决策问题

董事会包自动生成（复用 P013）、风险矩阵（RiskMatrix）、决策待办（P008）：
**下一次董事会，材料一键成包，风险与待决事项一目了然。**

## ② 功能清单

**v1**
- 董事会包模板（P013 composer 新模板 board-pack）：封面 → 经营 KPI（P018）→ 组合表现（P012）
  → 风险矩阵 → 决策待办（P008 open）→ 附录（引用报告清单）。
  验收：一键生成 board-pack 报告并可打印成 PDF；每节缺数据显示缺口而非空白。
- 风险登记册：`risk_register`（风险/likelihood×impact/owner/缓解措施/状态）。
  验收：RiskMatrix 图由真表驱动；矩阵格点击列风险明细。
**v2**
- 会议纪要与决议跟踪（决议→P008 决策条目自动创建）；季度对比（上季包 vs 本季 Δ）。
**v3**
- agent 起草执行摘要（P020，人审门禁同 P013）。

## ③ 后端

```
risk_register(id PK, scope 'group'|'company', scope_id?, title, likelihood 1-5, impact 1-5,
              owner, mitigation, status 'open'|'mitigating'|'closed', updated_at, source_id FK?)
board_meeting(id PK, date, agenda_json, pack_report_id FK?)
```
```
GET/POST /v1/board/risks            → { risks[] }
GET /v1/board/meetings              → { meetings[] }
POST /v1/board/pack/generate        → { report }      // 走 P013 /reports/generate(type=board-pack)
```
`boardComposer`：board-pack 节 pipeline（吃 P018/P012/P008/risk_register）。

## ④ 前端

路由：`/board`（会议列表 + 风险登记册 tabs）；包文档在 /reports/[id]（ReportLayout）。
布局：风险登记册 = RiskMatrix（现有 viz）+ DataTable；likelihood/impact 编辑 Dropdown 1–5；
会议卡显示日期/议程/包状态。四态：无风险 empty=「登记第一条风险」。
交互：矩阵格 hover 高亮对应表行；「生成董事会包」主按钮（accent，一处）。

## ⑤ 依赖
吃 P013 composer、P018、P012、P008；被吃：无。可独立上线：风险登记册可先行；包需 P013。

## ⑥ 数据来源与 source.kind
风险条目 manual；包内引用随上游。

## ⑦ 风险与 stop conditions
- 包内数据口径混乱 → 每节标数据截至与来源模块；**stop**：任一节数据过期 >30 天则包标 draft 不能转 final。
