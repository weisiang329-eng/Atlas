# P006 — 行业情报引擎 Industry Intelligence（含 P026 手套迁移）· Design

> docs/design/P006-industry-intelligence-design.md · v1 草案 · P026 = 本模块 Phase 2–3

## ① 使命与决策问题

把行业按**价值链**摆出来：谁供给谁、产能与格局、成本因子、周期信号、同业对比。
回答：**这个行业现在处于周期什么位置？成本端发生了什么？格局谁强谁弱？传导到哪家公司？**
两条首发价值链：AI 基建（设计→制造→存储→设备→网络→电力冷却→云）与大马手套
（原料 NBR/天然胶乳→制造→分销→医疗/工业需求）。

## ② 功能清单

**v1**
- 行业树：Sector→Industry→Company 挂载（现有 3 sector 落库）。验收：/industries 树可导航。
- 价值链地图：`value_chain_node/edge`（环节/公司挂载/供给关系）。验收：两条链的图可视化 + 点击跳公司页。
- 同业对比表：同表并列关键指标（营收/毛利率/产能/市占，来自 P004 facts + industry_metric）。
  验收：手套 7 家、AI 基建 10 家各一张 DataTable，可排序。
- 成本因子曲线 v1：`commodity_series`（NBR/原油/天然气/USDMYR/MARGMA ASP；晶圆价/资本开支）。
  验收：TrendChart 画任一序列 ≥3 年。
**v2（P026 Phase 2 迁移）**
- glove-tracker 数据迁入：commodity 序列 + `industry_metric`（ASP/稼动率/产能）+ 555 季度对齐。
  验收：glove-tracker 网站可下线，Atlas 行业页信息不少于原站。
- 爬虫移植：glove-tracker cron 爬虫 → Workers Cron（MARGMA/商品价/汇率）。验收：断更 >7 天自动告警（P024）。
**v3（P026 Phase 3）**
- 周期信号推理：ASP 环比、库存天数、毛利率拐点 → `cycle_signal`（状态机：底部/回升/过热/下行）。
  验收：每信号带计算依据与证据链；信号变化产生 P011 告警事件。

## ③ 后端

**D1 表**
```
sector(id PK, name)   industry(id PK, sector_id FK, name)
value_chain_node(id PK, industry_id FK, stage_order INT, name)        // 设计/制造/存储/…
value_chain_membership(node_id FK, company_id FK, role_note)
value_chain_edge(id PK, from_node FK, to_node FK, label)              // 供给方向
commodity_series(id PK, code 'NBR'|'BRENT'|'NATGAS'|'USDMYR'|'MARGMA_ASP'|'WAFER'|…, name, unit, currency)
commodity_point(series_id FK, date, value REAL, source_id FK)  UNIQUE(series_id,date)
industry_metric(id PK, industry_id FK, company_id FK?, code 'asp'|'utilization'|'capacity'|'inventory_days',
                period, value REAL, unit, source_id FK)  INDEX(industry_id,code,period)
cycle_signal(id PK, industry_id FK, code, state 'bottom'|'recovery'|'peak'|'downturn',
             as_of, rationale_json, source_id FK)                      // v3
```

**/v1/ endpoints**
```
GET /v1/industries/tree                          → { sectors: SectorNode[] }
GET /v1/industries/:id/value-chain               → { nodes[], edges[], memberships[] }
GET /v1/industries/:id/compare?metrics=…         → { columns[], rows: CompareRow[] }
GET /v1/commodities/:code?range=5y               → { series: SeriesPoint[] }
GET /v1/industries/:id/signals                   → { signals: CycleSignal[] }   // v3
```

**domain 引擎**：`compareAssembler`（并表取数，无 UI 计算）；`cycleEngine`（v3：规则阈值 + 拐点检测，
版本化参数，rationale 记录输入数值）。**CF 组件**：Cron（爬虫，v2）、Queues（抓取重试）。

## ④ 前端

**路由树**
```
/industries                        行业树（Sector 卡 → Industry 列表）
/industries/[id]                   行业页：价值链地图(RelationshipGraph 复用) · 产能与格局表
                                   · 成本因子曲线(TrendChart 多序列切换) · 周期信号卡(v3)
                                   · 同业对比 DataTable
```
**区块布局**：价值链图用现有 `RelationshipGraph`（纯 SVG）按 stage_order 分层布点；
对比表 `DataTable` 首列冻结；成本曲线 `ChartContainer` + 序列切换 `Tabs`；
信号卡 = `KpiCard` 变体（state 徽章 StatusBadge + rationale 展开）。
**loader 四态**：每区块独立 loader；商品序列 empty=「序列未接入」。
**交互**：图节点点击→公司页；对比表列排序；曲线 hover 十字线（v2）；⌘K 搜行业。

## ⑤ 依赖

- 吃：P005 company、P004 facts（对比表财务列）、P003 source。
- 被吃：P009（周期信号进驾驶舱）、P015（自家工厂 vs 行业对标）、P016（采购价 vs commodity）。
- 可独立上线：v1 可以；v2 需 glove-tracker 数据导出一次性脚本。
- 需改：`glove-tracker` 仓库进入只读冻结，因数据与 cron 迁入本模块（写入 ADR）。

## ⑥ 数据来源与 source.kind

MARGMA/商品价/汇率爬虫（glove-tracker→迁移后 kind: glove-tracker 保留历史、新增 kind: crawler）、
公司产能=年报/公告（manual/sec-edgar/bursa）、晶圆价/资本开支（manual, 标 estimate 当为估算）。

## ⑦ 风险与 stop conditions

- 爬虫脆弱 → 双源校验 + 断更告警；**stop**：源站禁止抓取则改人工月更并在 UI 标注频率。
- 周期信号误导 → 信号永远带 rationale 与阈值版本；**stop**：回测命中率 <60% 的信号规则下线（P023 复盘）。
- 产能/市占数据主观 → 一律 estimate 标注 + ConfidenceBadge。
