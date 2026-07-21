# P023 — 学习引擎 Learning Engine · Design

> docs/design/P023-learning-engine-design.md · v1 草案

## ① 使命与决策问题

预测 vs 实际复盘（接 P008 决策日志），让评分模型迭代：**我们的判断准确率是多少？
哪个因子在骗我们？模型该往哪调？**

## ② 功能清单

**v1**
- 判断复盘统计：从 P008 closed 决策聚合命中率（按实体/行业/判断类型/时间）。
  验收：/research/learning 页出命中率 KPI 与分组 DataTable，每行可下钻到原决策。
- 预测登记：`prediction`（指标/目标值/期限，来自决策预期的结构化版）→ 到期自动比对实际
  （P027 价格 / P004 指标）。验收：到期自动出 right/wrong/partial 建议，人工确认落 P008。
**v2**
- 评分模型回测：历史时点分数 vs 之后 N 月收益的相关性（P010 score_history）；因子贡献报告。
**v3**
- 模型调参建议（agent 起草，P020）；学习摘要进周报（P013）。

## ③ 后端

```
prediction(id PK, decision_id FK, metric_kind 'price'|'fact-metric', metric_ref, comparator
           '>'|'<'|'between', target_json, due_date, actual_value REAL?, outcome?, resolved_at)
learning_stat(id PK, dim_json, period, hit_rate REAL, n INT)    // 物化
```
```
GET /v1/learning/stats?by=industry|kind|quarter → { rows[] }
GET /v1/learning/predictions?status=due         → { rows[] }
POST /v1/learning/predictions/:id/resolve       → { prediction }
GET /v1/learning/backtest?model=                → { points[], correlation }   // v2
```
`resolver` Cron：due 预测取实际值→建议 outcome；`backtester`（v2）：score_history×后续收益。

## ④ 前端

路由：`/research/learning`。布局：KpiCard（总命中率/近四季/样本数）+ 分组 DataTable +
到期待确认列表（warning 条）；v2 回测散点图（新 `ScatterChart` 纯 SVG，或复用现有 viz）。
四态：样本 <10 显示「样本不足，仅供参考」徽章。

## ⑤ 依赖
吃 P008、P010、P027、P004；被吃 P010（模型迭代输入）。可独立上线：需 P008 v1。

## ⑥ 数据来源与 source.kind
实际值 quote-feed/sec-edgar；统计 derived。

## ⑦ 风险与 stop conditions
- 小样本误读 → n 阈值与置信标注硬性显示；**stop**：n<10 的分组不显示百分比只显示计数。
