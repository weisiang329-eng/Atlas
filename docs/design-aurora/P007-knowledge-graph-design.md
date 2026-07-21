# P007 — 知识图谱引擎 Knowledge Graph · Design

> docs/design/P007-knowledge-graph-design.md · v1 草案

## ① 使命与决策问题

把公司之间的关系（供应商/客户/竞争对手/持股）变成可查询、可视化、可传导分析的图。
回答：**「NVDA 断供会伤到谁？」「这家公司的客户集中在谁身上？」** —— 传导分析是核心场景。

## ② 功能清单

**v1**
- 实体与关系：`entity/relationship/relationship_evidence` 三表；关系类型
  supplier / customer / competitor / shareholder / partner。
  验收：AI 基建 10 家 + 手套 7 家的核心关系 ≥60 条，全部带证据行。
- 公司页「关系」面板：按类型分组列出对手方，点击跳图谱视图。验收：overview 页面板由真表驱动。
- 图谱视图 /knowledge：以某公司为中心的 1–2 度关系图（复用 KnowledgeGraph 纯 SVG）。
  验收：节点点击可重新居中；边 hover 显示证据摘要。
**v2**
- 传导查询：「若 X 受冲击，沿 supplier/customer 边传播 N 度」→ 受影响公司列表 + 权重。
  验收：NVDA 断供查询返回按暴露度排序的列表，每行可点开证据。
**v3**
- 时间维度（关系 valid_from/until）；与 P021 记忆互链；ERP 供应商实体并入（P016）。

## ③ 后端

**D1 表**
```
entity(id PK, kind 'company'|'person'|'commodity'|'org', ref_id?, name)   // company 复用 company.id
relationship(id PK, from_entity FK, to_entity FK, kind 'supplier'|'customer'|'competitor'|
             'shareholder'|'partner', weight REAL?, note, valid_from?, valid_until?, source_id FK)
             INDEX(from_entity,kind) INDEX(to_entity,kind)
relationship_evidence(id PK, relationship_id FK, claim, source_id FK, confidence 'high'|'med'|'low')
```

**/v1/ endpoints**
```
GET /v1/graph/company/:id?depth=1|2&kinds=…  → { nodes: GraphNode[], edges: GraphEdge[] }
GET /v1/graph/impact/:id?kinds=supplier,customer&depth=2 → { impacted: ImpactRow[] }   // v2
GET /v1/companies/:id/relations              → { groups: { kind, rows: RelationRow[] }[] }
```

**domain 引擎**：`neighborhood(id,depth)` BFS 限 200 节点；`impact(id)`（v2）
边权 = weight×confidence 系数，路径衰减 0.6/度，输出带路径引用。**CF 组件**：D1 即可。

## ④ 前端

**路由树**
```
/knowledge                         图谱工作台（搜索 + 中心图 + 右侧节点详情）
/companies/[id]（增强）             overview 加「关系」面板
```
**区块布局**：`SplitPaneLayout`——左图（KnowledgeGraph：按 kind 分色的边、节点=公司徽标字母），
右 `DetailPanelLayout`（选中节点档案摘要 + 关系列表 + EvidenceTable）。
传导查询（v2）：FilterBar 选冲击源与边类型 → 结果 DataTable（公司/暴露度/路径）。
**loader 四态**：图 loading=ChartSkeleton；empty=「该公司暂无已录入关系 → 去添加」。
**交互**：节点双击重居中；kind 图例可开关过滤；⌘K 搜实体；边点击开证据 Drawer。

## ⑤ 依赖

- 吃：P005 company/person、P003 source。
- 被吃：P016（断供风险）、P009（异动传导提示）、P021（实体画像）。
- 可独立上线：可以（关系数据手工起步）。
- 需改：`components/viz/knowledge-graph.tsx` 增加 kind→颜色映射 props，因现版单色。

## ⑥ 数据来源与 source.kind

年报供应商/客户披露（sec-edgar/bursa/manual）、新闻公告（news, v2）、持股=P005 shareholding 同步。
每条 relationship 至少 1 条 evidence；confidence 必填。

## ⑦ 风险与 stop conditions

- 关系可信度 → 低置信边默认虚线且不参与 impact 计算；**stop**：无证据关系禁止入库（约束）。
- 图规模膨胀 → depth/节点数硬上限 + 服务器端裁剪；**stop**：查询 >1.5s 即降 depth。
