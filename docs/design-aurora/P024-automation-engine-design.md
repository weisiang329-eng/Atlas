# P024 — 自动化引擎 Automation Engine · Design

> docs/design/P024-automation-engine-design.md · v1 草案

## ① 使命与决策问题

报告定时生成、告警推送、数据质量巡检——**平台的例行公事全部自动跑，且可观测。**
（注意：交易自动化明确不在此——P028 铁律，任何自动执行需独立风控设计再议。）

## ② 功能清单

**v1**
- 任务调度注册表：`automation_job`（kind/schedule/enabled/最近运行）统一管理所有 Cron
  （P006 爬虫、P011 规则、P012 指标、P022 摄取、周报生成）。
  验收：/admin/automation 一页看全平台定时任务状态；手动触发任一任务。
- 数据质量巡检：规则集（断更检测/数值跳变/覆盖率下降/source 缺失）→ `dq_issue` + P011 告警。
  验收：人为制造断更可在 24h 内出 critical 告警。
- 推送渠道：邮件（MailChannels）/ Telegram bot——P011 告警按 severity 路由。
  验收：critical 告警 5 分钟内到 Telegram。
**v2**
- 失败重试策略与死信队列；周报定时生成接 P013；任务依赖编排（A 成功后跑 B）。
**v3**
- agent 定时研究任务（P020）纳入同一调度视图。

## ③ 后端

```
automation_job(id PK, kind, module, schedule_cron, enabled, last_run_at, last_ok BOOL, config_json)
job_run(id PK, job_id FK, started_at, finished_at, ok, log TEXT, stats_json)
dq_rule(id PK, kind 'staleness'|'jump'|'coverage'|'missing-source', target_json, params_json, enabled)
dq_issue(id PK, rule_id FK, severity, detail_json, found_at, resolved_at?)
notify_channel(id PK, kind 'email'|'telegram', config_ref, severity_min)
```
```
GET /v1/automation/jobs           → { jobs[], recentRuns[] }
POST /v1/automation/jobs/:id/run  → { run }
GET /v1/automation/dq/issues      → { issues[] }
```
`scheduler`（单一 Cron 入口按注册表分发，避免散落 Cron 定义）；`dqScanner`；`notifier`
（Queues 消费 P011 告警→渠道）。**CF 组件**：Cron（唯一入口）、Queues、MailChannels、Telegram API。

## ④ 前端

路由：`/admin/automation`（任务 DataTable：模块/schedule/状态点/上次运行；运行日志 Drawer）
+ DQ issues tab（severity 分组）。四态：任务失败行 negative；全绿显示「所有系统正常」。
交互：enable/disable Toggle（确认 Dialog）；手动触发按钮。

## ⑤ 依赖
吃：P011（告警管道）、P013（周报）、P022（摄取任务）与各模块 Cron 注册；被吃：全平台。
可独立上线：注册表 + DQ v1 可以。
需改：各模块已有零散 Cron 迁入统一 scheduler（每模块一行改动，写明于各自文档）。

## ⑥ 数据来源与 source.kind
运行元数据 derived；DQ 引用上游 source。

## ⑦ 风险与 stop conditions
- 静默失败 → 巡检自巡检（scheduler 心跳，>2h 无心跳发 critical）；**stop**：推送渠道全挂时降级为 UI 横幅。
- 推送疲劳 → severity_min 每渠道可调；info 永不推送只入流。
