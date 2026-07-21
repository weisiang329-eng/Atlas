# P015 — 制造情报 Manufacturing Intelligence · Design

> docs/design/P015-manufacturing-intelligence-design.md · v1 草案

## ① 使命与决策问题

产能/稼动率/良率/交期——与 P006 行业指标**同构**：自家工厂 vs 行业对标。
回答：**我的工厂跑得满不满、良率稳不稳、交期兑现了没？和同业比处在什么水平？**

## ② 功能清单

**v1**
- 工厂指标摄取：从 ERP/生产系统拉 `factory_metric`（产能/产量/稼动率/良率/OTD 交期达成，
  按厂×线×月）。验收：家具厂近 12 个月四指标齐；缺失显示 —。
- 工厂工作台：KPI 条 + 趋势 + 线别对比表。验收：四态齐全，钻取到月度明细。
- 行业对标：同一图上画自家稼动率 vs P006 industry_metric（如手套业稼动率）。
  验收：对标序列可开关；单位/口径注记显示。
**v2**
- 良率损失瀑布（缺陷分类）；交期漏斗（下单→排产→完工→发货）。
**v3**
- 产能规划情景（新增线/班次的产能弹性）；异常 → P011 告警。

## ③ 后端

**D1 表**
```
factory(id PK, erp_source_id FK, name, site)
production_line(id PK, factory_id FK, name, capacity_month REAL, unit)
factory_metric(id PK, line_id FK, period 'YYYY-MM', code 'output'|'utilization'|'yield'|'otd',
               value REAL, source_id FK)  UNIQUE(line_id,period,code)
```
**/v1/ endpoints**
```
GET /v1/manufacturing/factories                    → { factories[], lines[] }
GET /v1/manufacturing/:factoryId/metrics?range=12m → { series: {code, points[]}[] }
GET /v1/manufacturing/:factoryId/benchmark?industry= → { own[], industry[] , notes }
```
**domain 引擎**：`mfgAggregator`（线→厂汇总，稼动率=产量/产能 后端算）；对标序列直接引 P006。
**CF 组件**：Cron（随 P014 同步节奏）。

## ④ 前端

**路由树**：`/erp/[sourceId]/manufacturing`（厂选择 → 工作台）。
**区块布局**：KpiCard×4（本月稼动率/良率/OTD/产量）；ChartContainer 趋势（TrendChart 多序列）；
线别对比 DataTable；对标图（自家实线 accent、行业 faint 虚线——图表语法同全站）。
**loader 四态**：未配置产线 empty=「先在 ERP 侧映射产线」。
**交互**：厂/线切换、期间切换、对标行业选择 Dropdown。

## ⑤ 依赖
- 吃：P014 摄取框架与 erp_source、P006 industry_metric。被吃：P018。
- 可独立上线：需 P014 v1。
- 需改：无。

## ⑥ 数据来源与 source.kind
ERP/生产系统（erp）；行业对标（P006 各 kind）；口径备注 manual。

## ⑦ 风险与 stop conditions
- 口径不一致（自家稼动率 vs 行业口径）→ 对标图强制显示口径注记；**stop**：口径未确认前对标默认关闭。
