# P016 — 采购供应链 Procurement & Supply Chain · Design

> docs/design/P016-procurement-supplychain-design.md · v1 草案

## ① 使命与决策问题

供应商表现、采购价 vs commodity 曲线对标、断供风险（连 P007 图谱）。
回答：**我买贵了吗（对标大宗）？哪家供应商在恶化？断供会从哪里传导进来？**

## ② 功能清单

**v1**
- 供应商账本：`supplier` + 采购订单摄取（P014 管道扩展 purchase 实体）。
  验收：供应商列表含 12 个月采购额/份额/交付准时率。
- 采购价对标：采购单价序列 vs P006 commodity_series（如 NBR、木材、食品原料——序列可配映射）。
  验收：同图双序列 + 价差%列；映射表可维护。
- 断供风险 v1：供应商单一来源标记（份额 >60% 的品类）+ 风险清单。
**v2**
- 供应商实体并入 P007 图谱（supplier 边）；传导查询（上游商品涨价→受影响 SKU/毛利）。
- 供应商评分卡（交期/质量/价格趋势三因子）。
**v3**
- 替代源建议清单；合同到期提醒（P011）。

## ③ 后端

**D1 表**
```
supplier(id PK, erp_source_id FK, ext_id, name, category)  UNIQUE(erp_source_id,ext_id)
purchase_order(id PK, source_id FK, supplier_id FK, date, sku_id FK?, qty REAL, unit_price REAL,
               currency, otd BOOL?)  INDEX(supplier_id,date)
price_benchmark_map(id PK, sku_category, commodity_code)      // 采购品类↔大宗序列映射
supplier_risk(id PK, supplier_id FK, kind 'single-source'|'price-drift'|'otd-decay',
              severity, detail_json, as_of)
```
**/v1/ endpoints**
```
GET /v1/procurement/suppliers                     → { rows: SupplierRow[] }
GET /v1/procurement/suppliers/:id                 → { profile, orders[], score? }
GET /v1/procurement/benchmark?category=           → { purchase[], commodity[], spreadPct[] }
GET /v1/procurement/risks                         → { risks: SupplierRisk[] }
```
**domain 引擎**：`procAggregator`（份额/准时率）；`benchmarkEngine`（月度均价 vs commodity，
价差%）；`riskScanner` Cron（单一来源/价差漂移/OTD 恶化规则）。**CF 组件**：Cron。

## ④ 前端

**路由树**：`/erp/[sourceId]/procurement`（供应商表 · 对标 · 风险 三 tabs）。
**区块布局**：供应商 DataTable（采购额/份额条/OTD%/趋势 Sparkline）；对标 ChartContainer
（采购价 accent 实线 vs commodity faint 虚线 + 价差% BarSeries tone=semantic）；
风险清单 = severity 分组列表（同 P011 告警行样式）。
**loader 四态**：无映射 empty=「先配置品类↔大宗映射」。
**交互**：供应商行点开详情 Drawer；风险行跳 P007 图谱（v2）。

## ⑤ 依赖
- 吃：P014 摄取、P006 commodity、P007 图谱（v2）。被吃：P018。
- 可独立上线：需 P014 v1；对标需 P006 v1。

## ⑥ 数据来源与 source.kind
采购数据 erp；大宗 crawler/glove-tracker；映射 manual。

## ⑦ 风险与 stop conditions
- 品类映射粗糙 → 价差仅作方向参考并标注；**stop**：映射置信不足的品类不出对标图。
- 供应商敏感信息 → 权限限老板（P025）。
