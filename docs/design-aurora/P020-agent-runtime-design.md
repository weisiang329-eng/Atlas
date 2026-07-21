# P020 — Agent 运行时 Agent Runtime · Design

> docs/design/P020-agent-runtime-design.md · v1 草案 · Stage 4

## ① 使命与决策问题

Workers AI / 外部 LLM 的 agent 编排框架：研究任务 → 工具调用 → 产出。
**让 Atlas 会自己做研究**——但产出永远是草稿，人审后才成为事实。

## ② 功能清单

**v1**
- 任务模型：`agent_task`（类型/输入/状态/产出引用）+ 运行日志 `agent_run`（步骤/工具调用/tokens/耗时）。
  验收：「总结某公司本季变化」任务可跑通：取数（P004/P005 endpoints 作为工具）→ 产出草稿 note。
- 工具注册表：白名单工具（只读 endpoints + 写入仅限 draft 实体）。验收：越权工具调用被拒并记日志。
- 运行台 /agents：任务列表/详情（步骤 timeline、每步输入输出可展开）。
**v2**
- 定时研究任务（P024 Cron 触发）；多步计划（plan→execute→verify）；报告节草稿（P013 v3）。
**v3**
- 记忆检索工具（P021 Vectorize）；自评与重试策略；成本预算护栏。

## ③ 后端

```
agent_task(id PK, kind, input_json, status 'queued'|'running'|'done'|'failed'|'cancelled',
           output_ref_kind?, output_ref_id?, created_at, finished_at, budget_tokens INT)
agent_run(id PK, task_id FK, step INT, tool, input_json, output_json, tokens INT, ms INT)
agent_tool(id PK, name, endpoint, method, readonly BOOL, enabled)
```
```
POST /v1/agents/tasks              → { task }
GET  /v1/agents/tasks?status=      → { tasks[] }
GET  /v1/agents/tasks/:id          → { task, runs[] }
POST /v1/agents/tasks/:id/cancel   → { task }
```
`agentOrchestrator`（Queues consumer）：LLM 循环（Workers AI 或外部 API）→ 工具调用经注册表校验
→ 步骤落 agent_run → 产出写 draft 实体（note/report 草稿，kind: ai-draft）。
**CF 组件**：Queues（任务队列）、Workers AI / 外部 LLM（secret）、Cron（v2 定时）。

## ④ 前端

路由：`/agents`（任务列表 DataTable：类型/状态 StatusBadge/耗时/tokens）+ `/agents/[id]`
（步骤 Timeline，每步工具+输入输出 code 块，产出链接）。
四态：running 任务行轮询 5s；failed 显示最后一步错误与重试按钮。
交互：新建任务 Dialog（kind→动态参数）；取消需确认。

## ⑤ 依赖
吃：P021（v3 记忆）、各只读 endpoints 作为工具；被吃：P013 v3、P019 v3、P024。
可独立上线：v1 可以（只读工具集起步）。

## ⑥ 数据来源与 source.kind
产出 kind: `ai-draft`；引用的取数随上游。运行日志本身 derived。

## ⑦ 风险与 stop conditions
- 幻觉入库 → 硬门禁：agent 只能写 draft，人审转正；**stop**：发现绕过 draft 的写路径立即禁用该工具。
- 成本失控 → 每任务 budget_tokens 上限 + 日总额度；**stop**：日额度用尽队列暂停。
- 外部 LLM 数据出境 → 敏感（ERP/组合）数据默认不进外部 LLM，仅 Workers AI；例外需白名单。
