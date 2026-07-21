# P005 — 公司情报引擎 Company Intelligence · Design

> docs/design/P005-company-intelligence-design.md · v1 草案

## ① 使命与决策问题

一家公司 5 分钟建立全景：档案、产品线、管理层、股权结构、大事年表，全部可溯源。
回答：**这家公司是做什么的？靠什么赚钱？谁在管？结构性风险在哪里？最近发生了什么？**
它是公司页（overview/profile/products/management/timeline 子页已有骨架）的数据实体层，
也是 P006/P007/P010/P027 的主语（company 实体）。

## ② 功能清单

**v1**
- 公司档案：`company` 扩展（简介/总部/上市地/官网/财年制度/行业挂载）。
  验收：17 家现有公司档案齐全，overview 页无 — 缺项（除确实无数据者）。
- 产品线：`product_line`（名称/描述/收入占比 est/关联行业节点）。验收：NVDA 至少 4 条产品线并带 source。
- 管理层：`person` + `company_officer`（姓名/职务/任期/简历要点）。验收：每公司 ≥3 名高管。
- 大事年表：`company_event`（日期/类型/标题/摘要/source）。验收：timeline 页由真表驱动，倒序分页。
- 股权结构 v1：`shareholding`（股东/比例/as_of/source，手工维护）。验收：手套七家控股家族可见。
**v2**
- 年报/官网/新闻半自动摄取（R2 存 PDF + 提取管道，接 P022）；股权穿透图（喂 P007）。
**v3**
- 变更侦测（管理层变动/新产品发布 → P011 告警源）；档案置信度分级（ConfidenceBadge）。

## ③ 后端

**D1 表**
```
company（已有，扩展列）: description, hq, exchange, fiscal_year_end, website, industry_id FK
product_line(id PK, company_id FK, name, description, revenue_share_est REAL?, industry_node_id?, source_id FK)
person(id PK, name, bio_brief)
company_officer(id PK, company_id FK, person_id FK, title, since TEXT?, until TEXT?, source_id FK)
company_event(id PK, company_id FK, date, kind 'earnings'|'product'|'mna'|'management'|'capacity'|'other',
              title, summary, source_id FK)  INDEX(company_id,date)
shareholding(id PK, company_id FK, holder_name, pct REAL, as_of, source_id FK)
```

**/v1/ endpoints**
```
GET /v1/companies/:id/profile     → { company, productLines[], officers[], shareholdings[] }
GET /v1/companies/:id/events?page → { events: CompanyEvent[], total }
GET /v1/companies?industry=&q=    → { companies: CompanySummary[] }   // 列表/搜索（⌘K 用）
```

**domain 引擎**：`profileAssembler(companyId)`——聚合档案并按 source 附证据 id；无计算。
**CF 组件**：D1；v2 起 R2（年报 PDF）+ Queues（提取任务）。

## ④ 前端

**路由树**（骨架已存在，本模块填实）
```
/companies                         公司 · Companies（DataTable：名称/行业/交易所/最新营收）
/companies/[id]/overview           全景（KPI 条 + 简介 + 最近事件 + 关系面板占位→P007）
/companies/[id]/profile            档案（股权 DataTable + 基本信息卡）
/companies/[id]/products           产品线（DataTable + 收入占比 BarSeries tone=accent）
/companies/[id]/management         管理层（officer 卡列表）
/companies/[id]/timeline           年表（Timeline 组件，kind 徽章 StatusBadge）
```
**区块布局**：全部复用 `WorkspaceLayout/DetailPanelLayout/DataTable/KpiCard/Timeline/Badge/SourceList`；
任何数字可点开 source（`EvidenceTable` 弹 Drawer）。
**loader 四态**：profile 聚合一个 loader；events 独立分页 loader；empty=「该节尚无数据 — 从年报导入」。
**交互**：⌘K 搜公司；行业 chip 跳 /industries/[id]；officer 点击展开简历。

## ⑤ 依赖

- 吃：P003 source；industry 树（P006 定义，先以现有 sector/industry 枚举过渡）。
- 被吃：P006/P007/P008/P009/P010/P011/P012/P013/P027/P028（company 是全平台主语）。
- 可独立上线：可以。
- 需改：`lib/mock/companies.ts` 退役为 seed 脚本，因页面转真 endpoint。

## ⑥ 数据来源与 source.kind

年报/官网（manual→v2 半自动, kind: manual / sec-edgar / bursa）、新闻（v2, kind: news 新增）、
既有 EDGAR facts（sec-edgar）。**规则：每行 source_id 非空；estimate 必须标 estimate。**

## ⑦ 风险与 stop conditions

- 手工维护成本 → v1 只保证 17 家深度；**stop**：新增公司若无 source 支撑，禁止入库（DB 约束）。
- 事实错误风险 → ConfidenceBadge + 溯源点开可查；管理层/股权类敏感字段双人复核（audit）。
