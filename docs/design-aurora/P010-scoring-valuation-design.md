# P010 — 评分与估值 Scoring & Valuation · Design

> docs/design/P010-scoring-valuation-design.md · v1 草案

## ① 使命与决策问题

多因子 Atlas Score（质量/成长/估值/周期位置/风险），版本化、可回看、每个分数带证据链；
估值 = 倍数带（P/E、EV/EBITDA、P/B 历史分位）+ 简易 DCF。回答：**这家公司现在贵不贵、
好不好、和它自己历史比处在什么位置？我的关注圈按分数怎么排？**

## ② 功能清单

**v1**
- 评分模型：`score_model/score_factor`（因子定义+权重，版本化）；`company_score/score_history`。
  验收：17 家公司出分；改模型权重生成新版本，旧分数可回看；每因子分可点开证据（输入数值+来源）。
- 排行榜 /scores：按总分/因子排序的 DataTable。验收：排序/筛选行业可用。
- 倍数带：P/E、EV/EBITDA、P/B 的 5–10 年分位（后端算），公司估值页画带状图。
  验收：当前值落点 + p25/p50/p75 带清晰可读。
**v2**
- 简易 DCF（后端：FCF 起点 + 增速/折现/终值三参数，输出敏感度矩阵）；估值结论卡（cheap/fair/rich 徽章）。
**v3**
- 周期位置因子接 P006 cycle_signal；分数变动告警（P011）；准确率复盘（P023）。

## ③ 后端

**D1 表**
```
score_model(id PK, version, name, active BOOL, created_at)
score_factor(id PK, model_id FK, code 'quality'|'growth'|'valuation'|'cycle'|'risk',
             weight REAL, spec_json)                       // spec: 输入指标与归一化规则
company_score(id PK, model_id FK, company_id FK, as_of, total REAL,
              factor_scores_json, evidence_json)           // evidence: 指标值+source_id 列表
score_history(同 company_score 结构，append-only)
valuation_band(id PK, company_id FK, metric 'pe'|'ev_ebitda'|'pb', as_of,
               current REAL, p25 REAL, p50 REAL, p75 REAL, window_years INT, source_id FK)
```

**/v1/ endpoints**
```
GET /v1/scores?model=active&industry=       → { rows: ScoreRow[] , model }
GET /v1/companies/:id/score                 → { score, factors[], evidence[] , history[] }
GET /v1/companies/:id/valuation             → { bands: ValuationBand[], dcf? }
```

**domain 引擎**：`scoreEngine.run(modelVersion)`——从 P004 facts 取指标→归一化→加权；
全部在后端，输出连同输入证据固化进 evidence_json（可审计）。`bandEngine`：历史倍数分位。
**CF 组件**：Cron（季度财报入库后重算）、Queues（批量重算）。

## ④ 前端

**路由树**
```
/scores                             Atlas Score 排行榜
/companies/[id]/valuation（填实）    评分卡 + 倍数带 + DCF(v2)
```
**区块布局**：排行榜 DataTable（总分列 + 五因子迷你条形）；评分卡=五因子雷达替代方案——
用横向因子条（BarSeries 变体）+ 每因子 EvidenceTable 入口；倍数带=自定义 Band 图
（新组件 `ValuationBand`：横带 p25–p75 + 中位线 + 当前值圆点，纯 SVG token 色）。
**loader 四态**：分数 empty=「该公司未纳入当前模型」。
**交互**：模型版本切换 Dropdown（回看历史版本分数）；因子点击展开证据。

## ⑤ 依赖

- 吃：P004 指标/比率、P005 company、P006 信号（v3）。被吃：P009/P013/P023。
- 可独立上线：可以（P004 就绪即可）。
- 需改：新组件 `components/chart/valuation-band.tsx`（随本模块交付）。

## ⑥ 数据来源与 source.kind

输入全部来自既有 facts（sec-edgar/bursa/glove-tracker）；模型参数 manual；分数本身 kind: `derived`（新增，
表示后端推导值，evidence_json 必须完整）。

## ⑦ 风险与 stop conditions

- 分数被误当投资建议 → UI 永远同屏显示因子构成与证据入口；**stop**：无证据链的分数禁止显示。
- 模型主观性 → 版本化 + P023 复盘准确率公开在模型页；**stop**：新版本上线需老板确认（active 开关手动）。
