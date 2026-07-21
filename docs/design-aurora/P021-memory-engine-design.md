# P021 — 记忆引擎 Memory Engine · Design

> docs/design/P021-memory-engine-design.md · v1 草案

## ① 使命与决策问题

研究结论与实体画像的长期记忆（D1 + Vectorize），供 agent 与搜索使用：
**Atlas 记得我们研究过什么、得出过什么结论、对每个实体的画像是什么。**

## ② 功能清单

**v1**
- 记忆条目：`memory`（实体/类型 结论|画像|事实/正文/embedding 引用/有效期/来源）。
  验收：research note 定稿与 P008 复盘自动生成记忆条目；公司页「Atlas 记得」面板显示相关记忆。
- 语义检索：Vectorize 索引 + `/v1/memory/search?q=`。验收：中文/英文查询均可召回相关条目并带出处。
**v2**
- 实体画像卡（按实体聚合记忆生成摘要，agent 起草人审）；记忆冲突检测（新结论 vs 旧结论矛盾提示）。
**v3**
- 时间衰减与置信更新；作为 P020 标准工具（retrieve/append）。

## ③ 后端

```
memory(id PK, entity_kind, entity_id, kind 'conclusion'|'profile'|'fact', text TEXT,
       vector_id TEXT, valid_until?, confidence, origin_kind 'note'|'decision'|'agent'|'manual',
       origin_id, created_at, source_id FK?)  INDEX(entity_kind,entity_id)
```
```
POST /v1/memory                    → { memory }        // 定稿钩子调用
GET  /v1/memory/search?q=&entity=  → { hits: MemoryHit[] }   // Vectorize topK + D1 回表
GET  /v1/memory/entity/:kind/:id   → { memories[] }
```
`memoryWriter`（嵌入 → Vectorize upsert → D1 行）；`memorySearch`（向量检索 + 过滤失效）。
**CF 组件**：Vectorize、Workers AI（embedding）、Queues（批量回填历史 note）。

## ④ 前端

路由：`/knowledge/memory`（搜索框 + 结果列表：条目/实体/出处/时间）；公司页 overview
加「Atlas 记得」折叠面板（top 5 相关记忆）。
四态：无记忆 empty=「定稿一篇研究笔记即开始积累」。交互：条目点击跳 origin（note/决策）。

## ⑤ 依赖
吃：research notes（现有）、P008、Workers AI/Vectorize；被吃：P020、P005 画像（v2）。
可独立上线：v1 可以。

## ⑥ 数据来源与 source.kind
记忆来自定稿内容（origin 引用）；agent 生成的画像 kind: ai-draft 人审后转 profile。

## ⑦ 风险与 stop conditions
- 过时结论误导 → valid_until + 冲突检测（v2）+ 出处必显；**stop**：无 origin 的记忆禁止入库。
- 向量成本 → 只索引定稿内容，草稿不索引。
