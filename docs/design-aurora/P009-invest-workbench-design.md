# P009 — 投资工作台 Invest Workbench · Design

> docs/design/P009-invest-workbench-design.md · v1 草案

## ① 使命与决策问题

把 Home 变成投资驾驶舱：**今天市场发生了什么？我的关注圈谁在异动？什么告警触发了？
我最近研究到哪了？** 每天打开 Atlas 的第一屏，动线的起点（Home→Watchlist→Alerts→公司页…）。

## ② 功能清单

**v1**
- 今日异动：watchlist 内 |涨跌%| Top N（吃 P027）。验收：盘中随轮询刷新，flash 动效。
- 告警汇总：未读告警按严重度分组（吃 P011）。验收：点击直达告警来源实体。
- 财报日历：`earnings_event`（未来 30 天 watchlist 公司）。验收：倒序时间轴，点击跳公司页。
- 最近研究：最近编辑的 research note / 未复盘决策（吃 P008 + 现有 research notes）。
- 周期信号面板：行业信号状态卡（吃 P006 v3；未就绪时隐藏区块）。
**v2**
- 可配置布局（DashboardGrid 拖拽持久化 localStorage）；每日自动简报块（吃 P013 weekly-brief 的日版）。
**v3**
- agent 生成「今日值得注意」摘要（P020）。

## ③ 后端

**D1 表**：仅新增 `earnings_event(id PK, company_id FK, date, kind 'earnings'|'agm'|'exdiv', note, source_id FK)`；
其余全部聚合既有模块。

**/v1/ endpoints**
```
GET /v1/workbench/today   → { movers: Mover[], alerts: AlertSummary[], earnings: EarningsEvent[],
                              recentResearch: ResearchRef[], signals: CycleSignal[] }
```
单一聚合 endpoint（一次 loader 拉全屏），后端并行取数拼装；各字段独立可空（前端分区块四态）。

**domain 引擎**：`workbenchAssembler(userId)`——纯聚合无计算；movers 排序在后端。
**CF 组件**：无新增；edge cache 15s 对齐 P027。

## ④ 前端

**路由树**：`/`（替换现 Home 内容为驾驶舱）。

**区块布局**（DashboardGrid 12 列）
- 行1：指数条 StatGrid（P027 KpiCard×4, flash）
- 行2：今日异动（8 列，DataTable 紧凑 + Sparkline）｜告警汇总（4 列，severity 分组列表）
- 行3：财报日历（4 列 Timeline）｜周期信号（4 列信号卡）｜最近研究/未复盘决策（4 列列表）
**loader 四态**：整页一个聚合 loader + 各区块独立 empty（如「watchlist 为空」引导去添加）；
error 只降级对应区块不整页红。
**交互**：所有行都是跳转入口；⌘K 全局；「记录决策」快捷按钮在页头 actions。

## ⑤ 依赖

- 吃：P027 quotes、P011 alerts、P006 signals、P008 decisions、P005 events/companies。
- 被吃：P013（周报引用今日异动逻辑）、P018（CEO 仪表盘同构复用 DashboardGrid 模式）。
- 可独立上线：分区块渐进——P027 就绪即可上（其余区块 empty 态显示「模块未启用」）。
- 需改：现 `app/page.tsx`（Sprint 000 dashboard 样例）整页替换，因驾驶舱是其正式形态。

## ⑥ 数据来源与 source.kind

财报日历：交易所/公司 IR 日历（manual 起步，v2 crawler）；其余来源随上游模块。

## ⑦ 风险与 stop conditions

- 聚合 endpoint 变慢 → 后端并行 + 分字段超时降级（单字段 >800ms 返回空并标 degraded）；
  **stop**：聚合 P95 >2s 时拆分为分区块 endpoints。
