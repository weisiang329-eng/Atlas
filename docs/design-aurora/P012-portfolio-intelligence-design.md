# P012 — 组合情报 Portfolio Intelligence · Design

> docs/design/P012-portfolio-intelligence-design.md · v1 草案

## ① 使命与决策问题

持仓、成本、权重、行业暴露、组合级指标：**我现在的仓位健康吗？集中度在哪里？
今天/今年赚亏多少？** 组合是研究（P005–P010）与执行（P028）之间的账本。

## ② 功能清单

**v1**
- 持仓账本：`holding`（手工录入 + P028 成交自动回写）；市值/权重/未实现盈亏由后端算（吃 P027 价）。
  验收：/portfolio 表列：数量/成本/现价/市值/权重/未实现$%/当日%，全 `.num`，缺价显示 —。
- 组合概览：总市值、当日盈亏、YTD、现金；资产/行业暴露（donut/bar）。
  验收：暴露图与持仓表一致（同一后端聚合）。
- 交易流水：`transaction`（buy/sell/dividend/fee/cash，手工 + P028 回写）。验收：任一持仓可展开流水。
**v2**
- 组合级指标（波动率/回撤/vs 基准）后端计算；多组合（真实/paper/主题）；行业暴露 vs 目标配置偏离。
**v3**
- 情景分析（接 P007 传导：某公司受冲击→组合暴露）；税务批次（lot）。

## ③ 后端

**D1 表**
```
portfolio(id PK, name, base_currency, kind 'real'|'paper'|'model')
holding(id PK, portfolio_id FK, company_id FK, qty REAL, avg_cost REAL, as_of, source_id FK)
        UNIQUE(portfolio_id,company_id)
transaction(id PK, portfolio_id FK, company_id FK?, kind 'buy'|'sell'|'dividend'|'fee'|'cash',
            qty REAL?, price REAL?, amount REAL, at, note, source_id FK)  INDEX(portfolio_id,at)
portfolio_metric(id PK, portfolio_id FK, as_of, code 'nav'|'day_pnl'|'ytd'|'vol'|'drawdown',
                 value REAL)                                   // 后端算，UI 零计算
```

**/v1/ endpoints**
```
GET /v1/portfolios/:id/overview   → { totals, exposures: {byClass[],byIndustry[]}, metrics[] }
GET /v1/portfolios/:id/holdings   → { rows: HoldingRow[] }     // 已含市值/权重/盈亏
GET /v1/portfolios/:id/transactions?page → { rows, total }
POST /v1/portfolios/:id/transactions     → { transaction }     // 手工录入
```

**domain 引擎**：`portfolioAssembler`——holding×quote→市值/权重/盈亏；`metricEngine` Cron 日更
nav/day_pnl/ytd（v2 加 vol/drawdown）。**CF 组件**：Cron（收盘后固化当日指标）。

## ④ 前端

**路由树**
```
/portfolio                总览（KPI 条 + 暴露 donut/bar + 持仓 DataTable + 流水）
```
**区块布局**：KpiCard×4（净值/当日/YTD/现金，flash 当日盈亏）；暴露=Donut（新纯 SVG 组件
`components/chart/donut.tsx`，token 色序）+ BarSeries；持仓表行内 Sparkline（近 30 日，吃 price_history）。
**loader 四态**：无持仓 empty=「录入第一笔交易」（Dialog 表单）。
**交互**：持仓行展开流水；「交易」按钮跳 P028 ticket（paper）；组合切换 Dropdown（v2）。

## ⑤ 依赖

- 吃：P027 quote/price_history、P005 company、P028 成交回写（可选）。
- 被吃：P009（组合区块）、P019（董事会包组合表现）、P028（下单前仓位校验）。
- 可独立上线：可以（手工流水即可闭环）。
- 需改：新增 `components/chart/donut.tsx`（随本模块交付）。

## ⑥ 数据来源与 source.kind

手工流水 manual；P028 回写 broker；估值价 quote-feed；指标 derived。

## ⑦ 风险与 stop conditions

- 账实不符 → 与 P028 对账 Cron（差异生成 warning 告警）；**stop**：连续对账差异 → 冻结自动回写改人工确认。
- 隐私 → 组合数据仅老板账户可见（P025 权限）。
