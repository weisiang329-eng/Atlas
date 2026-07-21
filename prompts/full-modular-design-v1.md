# Prompt — Full Modular Design (v1)

- **Agent name:** Atlas Chief Product Architect（任意 Claude Code session，工作目录 Desktop/Atlas）
- **Purpose:** 把 Atlas 全部模块（P003–P028）设计到完全模块化、subpage 级细节，含全站视觉 redesign、实时行情、交易执行
- **Inputs:** 本仓库（先读 handoff / roadmap / programs / schema / domain / types）
- **Output schema:** docs/design/00-master-index.md + docs/design/00-visual-refresh.md + 每模块 docs/design/P0XX-<name>-design.md，走 docs PR
- **Source requirements:** 引用现有代码给路径；与现状冲突要写明"需改 X 因为 Y"
- **Review requirements:** 先交 master-index + 视觉方向（3 选 1）给 owner 确认，再逐模块写；每 3-4 个模块 commit+push
- **Version history:** v1 — 2026-07-21，由 Claude（Fable 5）编写；对应 PR stack #26–#30 时点

---

以下为完整 prompt 正文，开新 session 直接整段粘贴使用：

```
你是 Atlas 平台的首席产品架构师。仓库：weisiang329-eng/Atlas（本地 Desktop/Atlas）。
任务：把 Atlas 的【全部模块 P003–P028】设计到完全模块化、subpage 级细节，并先完成全站视觉
redesign 方案。本 prompt 已把产品愿景、品牌、信息架构全部讲清楚，你不需要猜任何东西。

━━━━━━━━━━ 一、Atlas 是什么（产品语义，必须吃透） ━━━━━━━━━━

Atlas 是老板私有的 AI-native 决策智能平台（Decision Intelligence Platform），十年工程。
使用者是老板本人 + 他的团队。它回答三个问题：
① 市场正在发生什么变化？② 哪些公司/行业/供应商/客户/风险受影响？③ 管理层下一步该考虑什么决策？

三层演进（也是模块分期的逻辑）：
- 第一层【投资智能 Atlas Invest】（现在）：老板做全球 AI 基建投资研究（半导体/GPU/HBM/
  晶圆代工/光通信/数据中心/电力冷却）+ 马来西亚手套股周期研究（他是大马企业主，熟悉本地市场）。
- 第二层【企业智能 Atlas ERP/Ops】（之后）：接入他自己公司的 ERP（自研 Hono+D1 ERP），把
  "看股票"的方法用来"看自己的生意"：销售、产能、采购、库存、现金流。
- 第三层【决策层智能 Board/M&A/Agent】（最终）：CEO 仪表盘、董事会材料自动生成、M&A 分析、
  AI agent 持续自动研究，Atlas 变成一个会自己做研究的系统。

每天打开 Atlas 的动线（决定每个页面为谁存在）：
Home（今日变化+告警+KPI）→ Markets/Watchlist（实时行情异动）→ Alerts（触发的规则）→
某公司页（财务/估值/新闻/研究笔记）→ 行业页（周期信号/成本因子）→ 写 Research Note /
Decision Journal（记录判断和理由）→ 每周输出 Report（自动生成研究报告）。
会议/董事会场景看的东西：KPI 汇总、风险矩阵、决策待办、供应链地图、组合表现、报告导出。

已上线的真实能力（不要重新设计，要延伸）：
- 17 家公司真数据：10 家 AI 基建（NVDA/TSMC/AMD/ASML/AVGO/MU/SK hynix/INTC/ANET/VRT，
  SEC EDGAR 自动摄取，最深 19 个财年）+ 7 家大马手套股（TOPGLOV/HARTA/KOSSAN/SUPERMX/
  CAREPLS/COMFORT/HEXCARE，Bursa PDF 来源，2002→2026 共 555 个季度）
- 财务引擎：facts(概念→数值) → 三大报表/指标/比率全部后端计算，前端零计算
- 溯源体系：每个数值挂 source 行（kind: seed/sec-edgar/glove-tracker/manual/estimate）

━━━━━━━━━━ 二、Brand Guide（现状基线，redesign 在此之上升级） ━━━━━━━━━━

定位气质：机构级研究终端（Bloomberg terminal 的严肃感 × 现代 web 的克制），信息密度优先，
装饰为零。深色是主题态，浅色是覆盖态。

颜色（CSS 变量，dark 主题实际值）：
- 背景层：--bg #080b11 / --surface #0e131c（卡片）/ --surface-2 #131a26（悬浮/嵌入）
- 线条：--border #202a3a；文字：--fg #e7ebf2 / --muted #8c96a8 / --faint #5b657a
- 品牌色：--accent #f2b13d（琥珀金）+ --accent-dim #7a5c1f。规则：一个视图只准一个 accent
- 语义色（表达含义，禁止当装饰）：--positive #3fb96b 涨/好；--negative #f2555a 跌/坏/错误；
  --warning #e0a63a 注意；--info #5aa9e6 中性信息
- light 主题已有完整覆盖值；组件只准引用 token，禁止裸 hex

字体（IBM Plex 全家，next/font 已接）：
- IBM Plex Sans = UI 和正文；IBM Plex Mono = 数字/代码/ticker/eyebrow 标签（数字列必须
  tabular-nums）；IBM Plex Serif = 大标题 display
- .eyebrow 工具类：mono + 大写 + 加宽字距 + text-2xs，用于分区小标签

布局/密度：4px spacing 网格，gap 布局不用 margin；rounded-panel(0.5rem) + shadow-panel
单一卡片体系；密度双档（comfortable/compact，data-density 全局切换表格行高）；
图表全部纯 SVG 自绘（TrendChart/BarSeries/Sparkline/Heatmap/RelationshipGraph/
KnowledgeGraph/DecisionTree/RiskMatrix），禁止引第三方图表库。
现有组件库（新页面优先复用，见 docs/00-foundation/component-catalog.md）：
AppShell/WorkspaceLayout/DashboardGrid/SplitPaneLayout/DetailPanelLayout/TabNav、
DataTable(排序+搜索+分页)/StatementTable/ResultsTable/StatGrid/KpiCard/EvidenceTable/
SourceList/Timeline/ActivityFeed/StatusBadge/ConfidenceBadge、FilterBar/CommandSearch(⌘K)/
Dialog/Drawer/Tabs/Dropdown/Toast/DataState(loading-empty-error-ready 四态)、
ReportLayout + 9 种报告块。

【全站视觉 Redesign 指令 — 优先于一切模块设计】
现有 token 体系（IBM Plex + 琥珀金 accent + 深色主）保留为基础，但整体美感升级一个档次：
以「高级机构终端」为目标（参考 Bloomberg 的密度 × Linear/Arc 的精致度 × Moomoo 的行情
表现力）。要求：先出 docs/design/00-visual-refresh.md：层次系统（背景 4 层深浅）、图表
视觉语言（渐变填充/发光 accent 线/正负红绿规范）、数字动效（价格跳动 flash 绿/红）、
空态与加载骨架、卡片圆角阴影升级、亮色主题同步。出 3 个风格方向的描述 + 每方向一页
HTML mockup 给我选，选定后才动手改组件。禁止破坏 token 架构 — 是升级 token 值和组件
视觉，不是推倒重来。

━━━━━━━━━━ 三、信息架构：行业和公司怎么摆 ━━━━━━━━━━

层级：Sector（大类）→ Industry（细分）→ Company（公司）→ Period/Facts（财期/事实）。
现有 sector：Semiconductors（细分：AI Accelerators & GPUs / Foundry & IDM / Memory /
Semiconductor Equipment）、AI Infrastructure（Networking & Custom ASIC / DC Power &
Cooling）、Healthcare Manufacturing（Rubber & Medical Gloves）。

行业页要按【价值链】摆：AI 基建价值链 = 设计(NVDA,AMD) → 制造(TSMC,INTC) → 存储
(SK hynix,MU) → 设备(ASML) → 网络(AVGO,ANET) → 电力冷却(VRT) → 云/终端客户。
手套价值链 = 原料(NBR丁腈胶乳/天然胶乳) → 制造(大马四大+中小盘) → 分销 → 医疗/工业需求。
每个行业页必看：价值链地图（谁供给谁）、产能与格局表（各家产能/市占/稼动率）、成本因子
曲线（手套=NBR/原油/天然气/汇率；半导体=晶圆价/资本开支周期）、周期信号（ASP 环比、库存
天数、毛利率拐点）、行业内公司对比表（同表并列关键指标）。

公司页 subpage 已有骨架（要填实）：overview / profile / financials / valuation /
products / management / research / documents / timeline。公司之间的关系（供应商/客户/
竞争对手/持股）进知识图谱（P007），公司页显示"关系"面板，点击跳图谱视图。

摆法原则：任何列表默认 DataTable（可排序可搜索）；任何单值带 KpiCard + 微趋势 sparkline；
任何对比横向同表；任何数字可点开看 source；缺失显示 —。

━━━━━━━━━━ 四、硬性工程约束 ━━━━━━━━━━

- 全 Cloudflare：Workers(Hono API) + D1(Drizzle) + Pages(Next.js 静态导出)；扩展只准用
  R2(文件/PDF) / Vectorize(语义检索) / Queues+Cron(定时任务) / Workers AI(推理) /
  Durable Objects(WebSocket)。唯一例外：P028 的 trading-bridge（见该模块）。
- 唯一数据路径：loader → apiFetch<T> → Resource<T> → <DataState>；UI 永不计算、永不 fetch
- 计算全部在后端 src/domain/ 引擎；每个数值可溯源；缺数据显示 —，禁止编造
- 模块独立：各自 schema 表 + /v1/ API 前缀 + 前端 workspace；说清楚"做什么/怎么用/依赖谁"
- 每模块分 v1/v2/v3，v1 = 可独立上线的最小闭环；YAGNI
- 先读仓库现状：tasks/handoff-2026-07-21.md → management/roadmap + programs/*.md →
  schemas/database-v0.md → apps/api/src/db/schema.ts + src/domain/ → apps/web/lib/types.ts

━━━━━━━━━━ 五、要设计的全部模块（每个都要做） ━━━━━━━━━━

【Stage 1 核心智能】
- P005 公司情报引擎：公司档案/产品线/管理层/股权结构/大事年表，数据从年报+官网+新闻摄取；
  看什么：一家公司 5 分钟建立全景
- P006 行业情报引擎：第三节"行业怎么摆"的全部落地（价值链/产能/成本因子/周期信号/对比），
  含手套 P026 Phase2-3 迁移：commodity 序列表(NBR/原油/气/汇率/MARGMA ASP)、industry_metric
  表(ASP/稼动率/产能)、周期信号推理、glove-tracker 的 cron 爬虫移植成 Workers Cron
- P007 知识图谱引擎：entity/relationship/relationship_evidence 表；供应链/客户/竞争/持股
  关系；图谱可视化 + 公司页关系面板；看什么："NVDA 断供会伤到谁"这类传导分析
- P008 决策引擎：decision_journal（决策记录：判断/理由/预期/复盘）+ 假设(hypothesis)追踪
  + DecisionTree 可视化；看什么：我当时为什么这么判断，后来对不对

【Stage 2 投资 MVP】
- P009 投资工作台：把 Home 变成投资驾驶舱（今日异动/财报日历/告警汇总/最近研究）
- P010 评分与估值：score_model/score_factor/company_score/score_history 表；多因子打分
  （质量/成长/估值/周期位置/风险），版本化、可回看、每个分数带证据链；估值 = 倍数带
  (P/E,EV/EBITDA,P/B 历史分位) + 简易 DCF；看什么：Atlas Score 排行榜 + 单公司评分卡
- P011 Watchlist+告警：watchlist/alert 表；规则引擎（价格/财报/指标阈值/新闻关键词），
  Workers Cron 跑规则 → alert 流；看什么：今天有什么触发了我的规则
- P012 组合情报：持仓表/成本/权重/行业暴露/组合级指标；看什么：我现在的仓位健康吗
- P013 报告自动化：用 ReportLayout 9 种报告块，从真数据自动生成公司报告/行业报告/周报，
  可导出；看什么：给自己和董事会的成品文档

【Stage 3 企业智能】（设计成"接 ERP 数据源"的通用框架，字段对齐自研 Hono+D1 ERP）
- P014 ERP 情报：销售/订单/SKU/客户数据摄取 → 收入结构、客户集中度、SKU 毛利分析
- P015 制造情报：产能/稼动率/良率/交期——和 P006 行业指标同构（自家工厂 vs 行业对标）
- P016 采购供应链：供应商表现/采购价 vs commodity 曲线对标/断供风险（连 P007 图谱）
- P017 仓储运营：库存天数/周转/呆滞品
- P018 CEO 仪表盘：跨公司 KPI 汇总（多家企业）、现金流、异常警报；开会就看这页
- P019 董事会情报：董事会包自动生成（P013 复用）、风险矩阵(RiskMatrix)、决策待办(P008)

【Stage 4 AI-native】
- P020 Agent 运行时：Workers AI/外部 LLM 的 agent 编排框架（研究任务->工具调用->产出）
- P021 记忆引擎：研究结论/实体画像的长期记忆（D1+Vectorize），供 agent 和搜索用
- P022 持续研究引擎 v2+：季度 YTD-diff 摄取、ASML/TSMC 的 IFRS 映射、新闻/公告摄取管道、
  Cron 全自动更新（现在 EDGAR spike 已跑通年度）
- P023 学习引擎：预测 vs 实际复盘（接 P008 决策日志），让评分模型迭代
- P024 自动化引擎：报告定时生成、告警推送、数据质量巡检
- P025 Atlas 1.0：整合验收——统一导航、权限、审计日志、性能预算、上线清单

【新增 — 行情与交易】
- P027 实时行情 Markets：在 Atlas 内实时观看关注公司股价，对标 Moomoo 行情体验。
  数据源 adapter 层：quotes 表 + provider 接口（美股 Polygon/Finnhub WebSocket；Bursa
  延迟报价 adapter；来源同样入 source 溯源）。后端：Durable Objects 做 WebSocket fan-out；
  Cron 补收盘价入 D1（price_history 表，接返 glove-tracker 原有 prices 概念）。前端：
  /markets 工作台（watchlist 实时表：现价/涨跌%/迷你分时图，价格变动 flash 动效）、公司页
  实时报价头 + 分时/日K/周K 图（纯 SVG，新增蜡烛图组件）、⌘K 直达 ticker。
  v1 轮询 15s + 收盘历史，v2 才上 WebSocket 实时。
- P028 交易执行 Trading：在 Atlas 内对美股仓位下单（大马股只出信号不下单，Bursa 无散户
  API）。架构：broker adapter 层（moomoo OpenAPI / IBKR / Alpaca 三选一起步，接口统一）；
  因 OpenD/IB Gateway 需长开进程，设计独立 trading-bridge 服务（跑在 VPS/本地机，非
  Cloudflare），Atlas Worker 只与 bridge 通信；API key 只存 bridge，永不入前端。
  安全设计（硬性）：所有单先出 order ticket 确认画面（品种/方向/数量/价格/预估金额）→
  用户手动确认才送出；全程 audit log 入 D1；每日限额与风控规则表；paper trading 是 v1
  默认，真仓 v2 才开。前端：/trading 工作台（持仓/挂单/成交记录/paper-real 切换）、公司页
  「交易」按钮开 order ticket Drawer、与 P012 组合情报打通（成交自动入持仓）。
  明确写入设计文档：系统只执行用户手动确认的指令，不做自动交易信号执行（自动化留待 P024
  且需独立风控设计）。

━━━━━━━━━━ 六、每个模块的交付格式（一个都不能少） ━━━━━━━━━━

1. 使命 + 回答什么决策问题（一段）
2. 功能清单 v1/v2/v3，每条带一句话验收标准
3. 后端：D1 表(Drizzle 字段/索引/外键/溯源) · /v1/ endpoints(参数+响应 JSON 形状，与前端
   types 一字不差) · domain 引擎伪代码 · 用到的 CF 组件(Cron/Queues/R2/Vectorize/DO)
4. 前端：完整路由树(URL+标题) · 每页区块布局(复用哪些现有组件/新组件的 props 契约) ·
   每页 loader 与四态(loading/empty/error/ready 各显示什么) · 交互(筛选/切换/⌘K/跳转)
5. 依赖：吃谁的表/endpoint，被谁吃，能否独立上线
6. 数据来源与 source.kind
7. 风险与 stop conditions

━━━━━━━━━━ 七、输出与流程（durable-handoff 规则） ━━━━━━━━━━

- 写进仓库：docs/design/00-visual-refresh.md + docs/design/P0XX-<name>-design.md 每模块
  一份 + docs/design/00-master-index.md（总览表 + mermaid 依赖图 + 实施顺序）；更新
  roadmap 和 handoff
- 分支 docs/full-modular-design，完成后开 PR，body 写覆盖范围和遗留问题
- 引用现有代码给路径；与现状冲突要写明"需改 X 因为 Y"
- 流程：先出 master-index + 视觉 3 方向 mockup 给我确认 → 确认后按依赖顺序逐模块写细节
  → 每写完 3-4 个模块 commit + push 一次，防断线丢失

现在开始，先给我 master-index 和视觉方向。
```
