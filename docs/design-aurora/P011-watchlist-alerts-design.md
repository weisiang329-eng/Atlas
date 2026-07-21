# P011 — Watchlist + 告警 Alerts · Design

> docs/design/P011-watchlist-alerts-design.md · v1 草案

## ① 使命与决策问题

自选圈 + 规则引擎：**今天有什么触发了我的规则？** 价格阈值、财报事件、指标阈值、新闻关键词
（v2）都变成告警流，是每日动线第二站（Home→Watchlist→Alerts）。

## ② 功能清单

**v1**
- Watchlist CRUD：分组（如「AI 基建」「手套」）；行内实时价（吃 P027）。
  验收：/watchlist 由真表驱动；添加/移除即时生效于 P009/P027。
- 规则引擎 v1：价格类规则（价格穿越 X / 单日涨跌 > Y% / 距 52 周高低 < Z%）+ 财报临近提醒 +
  P008 决策到期提醒。Workers Cron 每 5 分钟跑规则 → `alert` 行。
  验收：规则命中生成一条告警且不重复（去重窗口）；/alerts 流按时间倒序。
- 告警流：已读/未读、按严重度/实体筛选。验收：全部可溯源到规则与触发数值。
**v2**
- 指标阈值规则（吃 P004：如毛利率跌破 X）、新闻关键词（吃 P022 新闻管道）；推送渠道（邮件/Telegram，经 P024）。
**v3**
- 规则模板库、告警聚合摘要（agent 日报，P020）。

## ③ 后端

**D1 表**
```
watchlist(id PK, name, sort INT)
watchlist_item(id PK, watchlist_id FK, company_id FK, added_at)  UNIQUE(watchlist_id,company_id)
alert_rule(id PK, name, entity_kind 'company'|'industry'|'decision', entity_id,
           kind 'price-cross'|'day-move'|'52w-distance'|'earnings-near'|'decision-due'|'metric-threshold',
           params_json, enabled, cooldown_min INT DEFAULT 1440)
alert(id PK, rule_id FK, fired_at, severity 'info'|'warning'|'critical',
      title, detail_json, read BOOL DEFAULT 0)  INDEX(read,fired_at)
```

**/v1/ endpoints**
```
GET/POST/DELETE /v1/watchlists, /v1/watchlists/:id/items
GET/POST/PATCH  /v1/alert-rules
GET  /v1/alerts?unread=1&severity=          → { alerts: Alert[] }
POST /v1/alerts/mark-read                   → { ok }
```

**domain 引擎**：`ruleRunner()` Cron */5min：取 enabled 规则 → 按 kind 分发 evaluator
（输入 P027 quote / earnings_event / decision horizon）→ 命中且过 cooldown → insert alert。
所有 evaluator 纯函数可单测。**CF 组件**：Cron；v2 Queues（推送）。

## ④ 前端

**路由树**
```
/watchlist            分组 tabs + 实时表（同 P027 表组件复用）+「添加公司」⌘K 入口
/alerts               告警流（FilterBar + 列表；未读高亮 border-strong）
/alerts/rules         规则管理（DataTable + 新建 Dialog：kind 选择驱动动态参数表单）
```
**区块布局**：告警行 = severity 色点 + 标题 + 触发数值（`.num`）+ 时间 + 来源实体链接；
规则表单每 kind 一组 params（price-cross: 方向+价位；day-move: 百分比…）。
**loader 四态**：alerts empty=「今天没有触发 — 一切平静」（正向 empty 文案）。
**交互**：未读计数徽章进侧栏 nav；标记已读单条/全部；告警点击跳实体页并高亮相关区块。

## ⑤ 依赖

- 吃：P027 quote、P005 company/earnings_event、P008 决策到期、P004（v2 指标）。
- 被吃：P009（汇总）、P024（推送与巡检）。
- 可独立上线：watchlist 部分可以；规则引擎需 P027 v1。
- 需改：`lib/nav.ts` alerts 项加未读徽章 slot。

## ⑥ 数据来源与 source.kind

告警 detail_json 内嵌触发数值的 source 引用（quote-feed/sec-edgar/…）；规则本身 manual。

## ⑦ 风险与 stop conditions

- 告警疲劳 → cooldown 默认 24h + 每规则命中率统计；**stop**：单规则日命中 >20 自动禁用并提示调参。
- Cron 频率 vs 时效 → 5min 起步；价格类 v2 改 P027 流内联触发。
