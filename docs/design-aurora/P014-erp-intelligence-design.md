# P014 — ERP 情报 ERP Intelligence · Design

> docs/design/P014-erp-intelligence-design.md · v1 草案 · Stage 3 企业智能的入口模块

## ① 使命与决策问题

接老板自己公司的 ERP（家具/餐饮，自研 Hono+D1），把「看股票」的方法用来「看自己的生意」：
**收入结构怎么变？客户集中度多高？哪些 SKU 在赚钱、哪些在拖后腿？**
设计成「接 ERP 数据源」的通用框架——字段对齐他的 Hono+D1 ERP，但 adapter 化以便接第二家企业。

## ② 功能清单

**v1**
- ERP 数据摄取：`erp_source`（企业/环境/凭证）+ 摄取管道拉 销售订单/SKU/客户 三实体，
  增量同步（Cron 每日 + 手动触发）。验收：家具 ERP 近 24 个月订单入库，同步状态页可见水位与错误。
- 收入结构：按月/按品类/按渠道收入序列（后端聚合）。验收：TrendChart/BarSeries 出图，钻取到订单列表。
- 客户集中度：Top N 客户占比、赫芬达尔指数（后端算）。验收：集中度 KPI + 客户排行 DataTable。
- SKU 毛利：SKU 收入-成本-毛利率排行、拖尾 SKU 清单。验收：可按品类筛选排序。
**v2**
- 第二数据源（餐饮 ERP）接入验证 adapter 通用性；同比/环比与季节性分解。
**v3**
- 异常检测（收入/毛利异常 → P011 告警）；与 P018 汇总。

## ③ 后端

**D1 表**
```
erp_source(id PK, company_label, base_url, auth_ref, enabled, last_sync_at, cursor_json)
erp_customer(id PK, source_id FK, ext_id, name, segment)         UNIQUE(source_id,ext_id)
erp_sku(id PK, source_id FK, ext_id, name, category, unit_cost REAL?)  UNIQUE(source_id,ext_id)
erp_order(id PK, source_id FK, ext_id, customer_id FK, date, status, total REAL, currency)
erp_order_line(id PK, order_id FK, sku_id FK, qty REAL, price REAL, cost REAL?)
erp_metric(id PK, source_id FK, code 'revenue'|'gross_margin'|'customer_hhi'|…,
           dim_json, period, value REAL)                          // 聚合结果物化
```
每行 source_id → source(kind:'erp')。

**/v1/ endpoints**
```
GET /v1/erp/sources                       → { sources[] , syncStatus }
POST /v1/erp/sources/:id/sync             → { job }
GET /v1/erp/:sourceId/revenue?by=month|category|channel → { series[] }
GET /v1/erp/:sourceId/customers/concentration → { topN[], hhi, trend[] }
GET /v1/erp/:sourceId/skus/margin?category=   → { rows: SkuMarginRow[] }
```

**domain 引擎**：`erpSyncer`（cursor 增量、幂等 upsert、字段映射 per-adapter）；
`erpAggregator` Cron 夜间物化 erp_metric。**CF 组件**：Cron、Queues（同步分页任务）、
Worker secrets（ERP 凭证）。

## ④ 前端

**路由树**
```
/erp                        企业选择 + 同步状态
/erp/[sourceId]             工作台：收入结构 · 客户集中度 · SKU 毛利 三 tabs
```
**区块布局**：与投资侧同构——KpiCard 条（本月收入/毛利率/HHI/活跃客户）+ ChartContainer +
DataTable 钻取；同步状态页 = Timeline（每次同步水位/行数/错误）。
**loader 四态**：未接 ERP empty=「连接你的 ERP → 配置指引」；同步中 loading 横幅。
**交互**：期间切换、品类/渠道 FilterBar、图点击钻取订单表。

## ⑤ 依赖

- 吃：老板 ERP 的 API（外部）；P003 source。被吃：P015/P016/P017/P018。
- 可独立上线：可以。
- 需改：无（新 workspace）。ADR 一篇：ERP adapter 契约（字段映射表放 schemas/）。

## ⑥ 数据来源与 source.kind

ERP API（kind: `erp` 新增）；成本缺失时毛利标 estimate。

## ⑦ 风险与 stop conditions

- ERP 数据质量（成本字段缺）→ 毛利分析降级为收入分析并明示；**stop**：字段映射覆盖率 <80% 的实体不开对应 tab。
- 凭证安全 → 凭证只存 Worker secret；只读权限接入。
