# P022 — 持续研究引擎 v2+ Continuous Research · Design

> docs/design/P022-continuous-research-design.md · v1 草案

## ① 使命与决策问题

让数据自己更新：季度 YTD-diff 摄取、ASML/TSMC 的 IFRS 映射、新闻/公告摄取管道、
Cron 全自动更新（EDGAR 年度 spike 已跑通）。**新财报出来当天，Atlas 已经算好了。**

## ② 功能清单

**v1**
- 季度摄取：EDGAR 10-Q YTD-diff（YTD 值差分出单季）→ facts。验收：NVDA 最新季自动入库并
  触发 P004 重算与 P011「财报更新」告警；diff 逻辑单测覆盖（YTD 重述场景）。
- IFRS 映射：ASML/TSMC（20-F/IFRS taxonomy）概念映射表 → facts 归一。
  验收：两家的三大报表在 /financials 与 US GAAP 公司同构显示。
- 摄取监控页：管道运行水位/失败/覆盖率。
**v2**
- 新闻/公告管道：RSS/公告源抓取 → `news_item`（实体链接、去重）→ P011 关键词规则可用；
  Bursa 季报 PDF 半自动（R2 存档 + 提取任务队列，人工校验闭环）。
**v3**
- 全自动：新 filing 侦测 → 摄取 → 重算 → 记忆/报告增量更新（连 P020/P024）。

## ③ 后端

```
ingest_pipeline(id PK, kind 'edgar-annual'|'edgar-quarterly'|'ifrs'|'news'|'bursa-pdf',
                enabled, schedule, last_run_at, status, stats_json)
ingest_run(id PK, pipeline_id FK, started_at, finished_at, ok BOOL, log_ref, rows_written)
concept_map(id PK, taxonomy 'us-gaap'|'ifrs', concept, atlas_concept, note)   // IFRS 映射
news_item(id PK, published_at, source_name, url, title, summary, entities_json, source_id FK)
```
```
GET /v1/ingest/pipelines            → { pipelines[], runs[] }
POST /v1/ingest/pipelines/:id/run   → { run }
GET /v1/news?entity=&q=             → { items[] }
```
`ytdDiffEngine`（单季=YTD_t−YTD_{t-1}，Q1 直取；重述检测：历史 YTD 变更即全季重算）；
`ifrsMapper`（concept_map 驱动）；`newsIngestor`（去重指纹 = url+title hash）。
**CF 组件**：Cron（每日 filing 扫描）、Queues（PDF 提取）、R2（原始文件存档）。

## ④ 前端

路由：`/admin/ingest`（管道 DataTable + 运行 Timeline + 覆盖率 KpiCard）；
`/news`（新闻流，实体 chips 过滤）——公司页 timeline 合流显示 news_item。
四态：管道失败行 negative 高亮 + 重跑按钮。

## ⑤ 依赖
吃：P003 基座（本模块是其 v2+）、P004（重算钩子）；被吃：P011 v2、P021、P024。
可独立上线：v1 可以。
需改：`schemas/database-v0.md` 升级 v1（facts 增 period 粒度列），因季度数据入库。

## ⑥ 数据来源与 source.kind
sec-edgar / bursa / news（新增）/ crawler；原始文件 R2 引用进 source 行（可回查原文）。

## ⑦ 风险与 stop conditions
- YTD 重述坑 → 重述检测 + 全季重算 + 变更审计；**stop**：diff 校验和不平（Q 加总≠YTD）该公司该年挂 warning 不入 facts。
- 新闻源版权 → 只存标题+摘要+链接，不存全文。
