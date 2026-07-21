# P008 — 决策引擎 Decision Engine · Design

> docs/design/P008-decision-engine-design.md · v1 草案

## ① 使命与决策问题

记录判断与理由，追踪假设，复盘对错：**「我当时为什么这么判断？后来对不对？」**
这是老板的决策资产库——越早开始记录越值钱，因此排在 W3 早波次。

## ② 功能清单

**v1**
- 决策日志：`decision_journal`（判断/理由/预期/期限/关联实体/状态 open|closed）。
  验收：从公司页/行业页一键「记录决策」，落库后 research/decision-journal 页可见（该路由已有骨架）。
- 假设追踪：`hypothesis`（陈述/验证条件/证据 for|against/状态 open|supported|refuted）。
  验收：决策可挂 ≥1 假设；证据行复用 source。
- 复盘：closed 决策必填 outcome + 教训；列表可按对/错/部分筛选。
**v2**
- DecisionTree 可视化（决策→假设→证据树，复用 components/viz/decision-tree）；
  预期 vs 实际自动比对（价格/指标目标接 P027/P004 自动回填）。
**v3**
- 喂 P023 学习引擎（判断准确率统计）、P019 决策待办（open 决策进董事会包）。

## ③ 后端

**D1 表**
```
decision_journal(id PK, title, thesis TEXT, rationale TEXT, expectation TEXT,
                 horizon_date, entity_kind 'company'|'industry'|'portfolio', entity_id,
                 status 'open'|'closed', outcome 'right'|'wrong'|'partial'?, lesson TEXT?,
                 created_at, closed_at, source_id FK?)  INDEX(status,horizon_date)
hypothesis(id PK, decision_id FK, statement, test_condition, status 'open'|'supported'|'refuted')
hypothesis_evidence(id PK, hypothesis_id FK, side 'for'|'against', claim, source_id FK)
```

**/v1/ endpoints**
```
GET  /v1/decisions?status=&entity=      → { decisions: Decision[] }
POST /v1/decisions                      → { decision }
POST /v1/decisions/:id/close            → { decision }         // 必带 outcome+lesson
GET  /v1/decisions/:id                  → { decision, hypotheses[], evidence[] }
POST /v1/decisions/:id/hypotheses       → { hypothesis }
```

**domain 引擎**：`reviewDue()` Cron 每日找 horizon_date 到期的 open 决策 → 生成提醒事件（P011 告警源）。

## ④ 前端

**路由树**（research 区已有骨架，填实）
```
/research/decision-journal             列表（FilterBar: 状态/实体/结局；DataTable）
/research/decision-journal/[id]        详情（决策卡 + 假设列表 + EvidenceTable + 复盘区）
```
**区块布局**：详情页 = `DetailPanelLayout`；决策卡（thesis/理由/预期/期限）+ 状态 StatusBadge；
复盘区 closed 后显示 outcome 徽章（right=positive / wrong=negative / partial=warning）+ lesson。
公司/行业页头部 actions 加「记录决策」按钮（Dialog 表单，预填 entity）。
**loader 四态**：empty=「还没有决策记录 — 记录第一条」（单动作）；close 动作 Dialog 强制填 outcome。
**交互**：到期决策在列表顶部 warning 条；⌘K「decision NVDA」预填新建。

## ⑤ 依赖

- 吃：P005 实体、P003 source；到期提醒挂 P011（无 P011 时先只在列表顶部显示）。
- 被吃：P019（决策待办）、P023（复盘统计）、P021（记忆）。
- 可独立上线：可以。

## ⑥ 数据来源与 source.kind

全部人工输入（manual）；v2 预期回填数值来自 quote-feed / sec-edgar。

## ⑦ 风险与 stop conditions

- 记录习惯难养成 → 入口放在研究动线内（公司页一键）+ 每周 P013 周报列出未复盘决策；
  **stop**：无。本模块无外部依赖风险，失败模式只有「没人写」，用产品动线解决。
