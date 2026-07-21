# P018 — CEO 仪表盘 CEO Dashboard · Design

> docs/design/P018-ceo-dashboard-design.md · v1 草案

## ① 使命与决策问题

跨公司 KPI 汇总（老板多家企业）、现金流、异常警报——**开会就看这页**：
**每家生意这个月怎么样？现金安全吗？哪里有异常需要我拍板？**

## ② 功能清单

**v1**
- 跨企业 KPI 网格：每企业一张卡（收入/毛利/现金/同比），点击进对应 ERP 工作台。
  验收：两家企业（家具/餐饮）卡片就绪；数据截至标注。
- 现金流面板：各企业现金余额 + 近 6 月净现金流 BarSeries tone=semantic。
- 异常警报区：P011 告警中 entity=erp 的 critical/warning 汇总。
**v2**
- 合并视图（多企业加总，币种换算 ExchangeRate 吃 P004）；月度经营简报一键生成（P013 模板）。
**v3**
- 投资侧净值并列（P012）——个人资产负债一页总览。

## ③ 后端

无新表（聚合 P014–P017 的 erp_metric + P011 alert）。
```
GET /v1/ceo/overview → { companies: CompanyKpiCard[], cash: CashPanel, alerts: AlertSummary[] }
```
`ceoAssembler`：并行聚合、分字段降级（同 P009 模式）。**CF 组件**：无新增。

## ④ 前端

路由：`/ceo`。布局：DashboardGrid——行1 企业卡（KpiCard 扩展：企业名+四指标+迷你趋势）；
行2 现金流（8列）+ 异常警报（4列）；页头「生成经营简报」按钮（v2）。
四态：某企业同步过期 >7 天 → 卡片 warning 边框 + 「数据陈旧」徽章。
交互：卡片点击进 /erp/[id]；告警行跳源。会议模式：`?present=1` 隐藏侧栏放大字号（compact 反向）。

## ⑤ 依赖
吃 P014–P017、P011、P004（汇率 v2）；被吃 P019。可独立上线：需 P014 v1（单企业即可先上）。

## ⑥ 数据来源与 source.kind
全部上游聚合（erp/derived）；无新增。

## ⑦ 风险与 stop conditions
- 数据陈旧误导决策 → 每卡「数据截至」硬性显示；**stop**：过期 >14 天的企业卡自动置灰。
