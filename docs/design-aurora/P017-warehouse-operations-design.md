# P017 — 仓储运营 Warehouse Operations · Design

> docs/design/P017-warehouse-operations-design.md · v1 草案

## ① 使命与决策问题

库存天数、周转、呆滞品：**多少钱压在仓库里？哪些货动不了？** 现金流视角看库存。

## ② 功能清单

**v1**
- 库存摄取：`inventory_snapshot`（SKU×仓×月：数量/成本值）。验收：近 12 个月快照入库。
- 指标：库存天数(DIO)/周转次数（后端算，物化 erp_metric）；呆滞清单（N 天无动销，N 可配）。
  验收：/erp/[id]/warehouse KPI + 呆滞 DataTable（金额排序）。
**v2**
- 品类/仓库维度拆解；库存趋势 vs 销售趋势同图；呆滞处理跟踪（标记→处理→复查）。
**v3**
- 安全库存建议；库存异常 → P011。

## ③ 后端

```
warehouse(id PK, erp_source_id FK, name)
inventory_snapshot(id PK, warehouse_id FK, sku_id FK, period 'YYYY-MM', qty REAL, cost_value REAL,
                   last_movement_at, source_id FK)  UNIQUE(warehouse_id,sku_id,period)
```
```
GET /v1/warehouse/:sourceId/kpis?period=      → { dio, turns, totalValue, deadstockValue }
GET /v1/warehouse/:sourceId/deadstock?days=90 → { rows: DeadstockRow[] }
GET /v1/warehouse/:sourceId/trend             → { inventory[], sales[] }
```
`invAggregator` Cron：DIO=平均库存/日均 COGS；deadstock=last_movement>阈值。全后端计算。

## ④ 前端

路由：`/erp/[sourceId]/warehouse`。布局：KpiCard×4（库存总值/DIO/周转/呆滞值）+
趋势 ChartContainer + 呆滞 DataTable（SKU/仓/金额/最后动销/天数）。
四态：无库存数据 empty=「ERP 库存模块未映射」。交互：days 阈值 Dropdown、仓筛选。

## ⑤ 依赖
吃 P014；被吃 P018。可独立上线：需 P014 v1。

## ⑥ 数据来源与 source.kind
ERP（erp）；COGS 用 P014 成本，缺失时 DIO 标 estimate。

## ⑦ 风险与 stop conditions
- 成本口径缺失 → 以数量口径降级并明示；**stop**：cost_value 覆盖率 <60% 时金额类 KPI 隐藏。
