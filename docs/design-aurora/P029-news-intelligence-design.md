# P029 — 新闻情报 News Intelligence · Design

> docs/design/P029-news-intelligence-design.md · v1 草案 · 扩展 P022 摄取 + P011 告警推送

## ① 使命与决策问题

爬虫收集全球新闻 + 持仓/关注股票的全部新闻，自动打标签、分级，**紧急/最高评级直接推送给老板**。
回答：**跟我的钱有关的世界发生了什么？哪条现在就必须知道？** 是每日动线的输入源，喂 Home 异动、
Watchlist、告警与研究笔记。

## ② 功能清单

**v1**
- 新闻摄取：Workers Cron 抓取源（路透/彭博 RSS、公司 IR/公告、Bursa/SEC filing 提要）→ `news_item`。
  验收：持仓公司近 7 天新闻入库、去重、带来源链接。
- 自动打标签：category（财报/并购/监管/供应链/宏观/产品）、country、event_type、关联实体（ticker）、
  priority（1–5，5=urgent）。验收：每条至少 category+country+priority+≥1 实体。
- Feed + 过滤：按 category / country / event / priority 多维筛选 + 全文搜索。
  验收：/news 四态齐全；urgent 置顶高亮。
- 紧急推送：priority≥5（或命中用户规则）→ 生成 P011 告警 + 经 P024 推邮件/Telegram。
  验收：制造一条 urgent 5 分钟内到达推送渠道。
**v2**
- 情绪/影响判定（正/负 + 受影响实体，喂 P007 传导）；关键词订阅规则（P011 复用）；R2 存原文快照。
- 「我的持仓相关」智能流：只看与 P012 持仓/P011 watchlist 相关的新闻。
**v3**
- AI 摘要与「今日必读」（P020 agent，人审门禁）；多语言（中/英/马来）翻译；进 P021 记忆。

## ③ 后端

**D1 表**
```
news_source(id PK, name, kind 'rss'|'ir'|'filing'|'exchange', url, country, enabled, last_run_at)
news_item(id PK, source_id FK, published_at, title, summary, url, country,
          category 'earnings'|'mna'|'regulation'|'supply-chain'|'macro'|'product'|'other',
          event_type, priority INTEGER(1-5), dedupe_hash, source_ref FK→source)
          INDEX(published_at) INDEX(priority) UNIQUE(dedupe_hash)
news_entity(id PK, news_id FK, entity_kind 'company'|'industry'|'commodity', entity_id, ticker)
news_subscription(id PK, kind 'ticker'|'keyword'|'category', value, min_priority, push BOOL)
```
- `source.kind` = `news`（P022 已引入）；紧急推送走 P024 `notify_channel`。

**/v1/ endpoints**
```
GET /v1/news?category=&country=&priority=&entity=&q=&page=  → { items: NewsItem[], total, facets }
GET /v1/news/:id                                            → { item, entities[], related[] }
POST /v1/news/subscriptions                                 → { subscription }
NewsItem = { id, publishedAt, title, summary, url, country, category, eventType,
             priority, entities:[{ticker,kind}], sourceName }
```

**domain 引擎（apps/api/src/domain/news/）**
```
crawl():        Cron */15min → fetch enabled sources → normalize → dedupe(hash=url+title)
tagger():       规则+词典打 category/country/event/priority；实体匹配 ticker↔company
                （priority: filing/监管/并购→高；命中订阅关键词→+1；watchlist 实体→+1）
pushUrgent():   priority>=5 或命中 push 订阅 → 建 P011 alert(critical) → P024 notifier
```
**CF 组件**：Cron（抓取）、Queues（抓取/NLP 重试）、R2（原文快照 v2）、Workers AI（摘要/情绪 v2）。

## ④ 前端

**路由树**
```
/news                     新闻情报（Feed + 过滤 + urgent 置顶）
/news/[id]                单条详情（正文摘要 + 关联实体 + 相关新闻 + 原文链接）
公司页（增强）             overview 加「相关新闻」区块（按 ticker 过滤）
```
**区块布局**：`WorkspaceLayout` → 顶部 urgent 横幅（若有 priority5 未读）→ `FilterBar`
（category/country/priority 分段 + 搜索）→ 新闻卡列表（时间倒序）：每条 = priority 色点 +
标题 + 摘要 + category/country 徽章 + 实体 chips（点击跳公司页）+ 来源+时间。
priority5 卡片 negative 边框 + 「URGENT」徽章置顶。右侧可选 facets（各 category 计数）。
**loader 四态**：empty=「暂无符合条件的新闻」；error 退避重试；urgent 轮询 60s。
**交互**：多维筛选（客户端或服务端分页两模式）；⌘K 搜新闻；卡片点开详情 Drawer；
「只看我的持仓」开关（吃 P012/P011 实体）。

## ⑤ 依赖
- 吃：P022 摄取框架、P005 company（实体匹配）、P012/P011（持仓/关注过滤）、P024（推送）。
- 被吃：P009（今日新闻）、P007（事件传导 v2）、P011（新闻关键词规则）、P021（记忆 v3）。
- 可独立上线：v1 可以（源接入 + feed）。

## ⑥ 数据来源与 source.kind
新闻源 RSS/IR/filing/exchange（kind: `news`）；原文快照 R2 引用；优先级/标签为 `derived`（规则产出，可回溯规则版本）。**只存标题+摘要+链接，不存全文正文（版权）**。

## ⑦ 风险与 stop conditions
- 版权：只存标题/摘要/链接，全文仅 R2 私有快照供内部检索，不对外分发。
- 误报疲劳：urgent 阈值保守 + 每源命中率统计；**stop**：单源日 urgent >5 自动降级该源优先级。
- 源脆弱/被封：多源冗余 + 断更告警（P024）；**stop**：源连续 48h 失败自动禁用并提示。
- 打标签错误：category/priority 带规则版本可回溯；情绪判定（v2）需人审才影响评分。
