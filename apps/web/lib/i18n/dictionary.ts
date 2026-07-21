/**
 * Atlas bilingual dictionary — Chinese (default) and English.
 *
 * Chinese is the primary language: it is the owner's working language and the
 * locale the app renders on first load. English is a full peer, not a
 * fallback, so terminology stays precise in both.
 *
 * Rules for editing:
 * - Every key must exist in BOTH dictionaries. `Dict` is derived from `zh`, so
 *   TypeScript fails the build if `en` drifts — that is the intended guard.
 * - Keys are dot-namespaced by area: `nav.*`, `common.*`, `home.*`, …
 * - Financial terms follow the glossary in
 *   `docs/INVESTMENT-METHODOLOGY.md` §3; do not invent a second translation
 *   for a metric that already appears there.
 * - Tickers, company names and filing labels (FY26, Q3) are never translated.
 */

export const zh = {
  // ── Shell / navigation ────────────────────────────────────────────────
  "nav.workspace": "工作区",
  "nav.home": "首页",
  "nav.companies": "公司",
  "nav.industries": "行业",
  "nav.valueChain": "价值链",
  "nav.markets": "行情",
  "nav.trading": "交易",
  "nav.news": "新闻",
  "nav.intelligence": "情报",
  "nav.scores": "评分排名",
  "nav.watchlist": "自选",
  "nav.portfolio": "组合",
  "nav.alerts": "提醒",
  "nav.knowledge": "知识图谱",
  "nav.research": "研究",
  "nav.reports": "报告",
  "nav.agent": "AI 分析师",
  "nav.enterprise": "企业",
  "nav.erp": "ERP 智能",
  "nav.ceo": "CEO 驾驶舱",
  "nav.board": "董事会",
  "nav.system": "系统",
  "nav.agentOps": "智能体运维",
  "nav.admin": "管理",
  "nav.settings": "设置",
  "nav.more": "更多",
  "nav.allSections": "全部模块",
  "nav.primaryMobile": "主导航",

  // ── Common UI ─────────────────────────────────────────────────────────
  "common.loading": "加载中…",
  "common.error": "加载失败",
  "common.retry": "重试",
  "common.empty": "暂无数据",
  "common.search": "搜索",
  "common.searchCompanies": "搜索公司",
  "common.filter": "筛选",
  "common.all": "全部",
  "common.prev": "上一页",
  "common.next": "下一页",
  "common.of": "共",
  "common.sample": "示例数据",
  "common.live": "实时",
  "common.notAdvice": "本平台仅供研究参考，不构成投资建议。",
  "common.awaitingData": "等待数据接入",
  "common.willRender": "将展示",
  "common.blockedOn": "前置条件",
  "common.noFabrication": "Atlas 绝不为真实公司编造数据 —— 在有可溯源数据之前，此模块保持为空。",
  "common.source": "数据来源",
  "common.asOf": "截至",
  "common.language": "语言",

  // ── Financial vocabulary (see INVESTMENT-METHODOLOGY §3) ──────────────
  "fin.revenue": "营业收入",
  "fin.grossProfit": "毛利",
  "fin.operatingIncome": "营业利润",
  "fin.netIncome": "净利润",
  "fin.eps": "每股收益",
  "fin.totalAssets": "总资产",
  "fin.totalEquity": "股东权益",
  "fin.totalDebt": "总负债",
  "fin.operatingCashFlow": "经营活动现金流",
  "fin.capex": "资本开支",
  "fin.freeCashFlow": "自由现金流",
  "fin.grossMargin": "毛利率",
  "fin.operatingMargin": "营业利润率",
  "fin.netMargin": "净利率",
  "fin.revenueGrowth": "营收增速（同比）",
  "fin.revenueCagr": "营收复合增速",
  "fin.roe": "净资产收益率",
  "fin.fcfMargin": "自由现金流利润率",
  "fin.cashConversion": "现金转化率",
  "fin.debtToEquity": "资产负债率（负债/权益）",
  "fin.currentRatio": "流动比率",
  "fin.quickRatio": "速动比率",
  "fin.interestCoverage": "利息保障倍数",
  "fin.incomeStatement": "利润表",
  "fin.balanceSheet": "资产负债表",
  "fin.cashFlow": "现金流量表",
  "fin.annual": "年度",
  "fin.quarterly": "季度",

  // ── Atlas Score ───────────────────────────────────────────────────────
  "score.atlasScore": "Atlas 评分",
  "score.grade": "评级",
  "score.profitability": "盈利能力",
  "score.growth": "成长性",
  "score.strength": "财务健康",
  "score.cash": "现金质量",
  "score.weight": "权重",
  "score.rankings": "评分排名",
  "score.rankingsDesc":
    "基于已披露财务数据的系统化多因子评分，覆盖全部跟踪公司。不构成投资建议。",
  "score.leaderboard": "Atlas 评分榜",
  "score.methodology": "评分方法",

  // ── Company ───────────────────────────────────────────────────────────
  "company.overview": "概览",
  "company.profile": "公司简介",
  "company.products": "产品",
  "company.management": "管理层",
  "company.financials": "财务",
  "company.relations": "关联关系",
  "company.research": "研究",
  "company.valuation": "估值",
  "company.documents": "文档",
  "company.timeline": "时间线",
  "company.ticker": "代码",
  "company.exchange": "交易所",
  "company.segment": "业务板块",
  "company.country": "国家/地区",

  // ── Home ──────────────────────────────────────────────────────────────
  "home.title": "投资驾驶舱",
  "home.coverage": "覆盖范围",
  "home.topScores": "评分领先",
  "home.companies": "家公司",
  "home.sectors": "个行业",
  "home.facts": "条财务数据",

  // ── Page headers (eyebrow / title / description per route) ────────────
  "page.home.eyebrow": "决策智能平台",
  "page.home.title": "Atlas Invest",
  "page.home.desc":
    "把市场变化转化为有据可依的决策。覆盖 AI 基础设施与橡胶手套两大板块 —— 每个数字都可溯源，每个评分都可复现，绝不编造。",
  "page.companies.eyebrow": "公司情报",
  "page.companies.title": "公司",
  "page.companies.desc":
    "当前覆盖的公司池。简介与财务数据由 Atlas API 提供，评分来自 Atlas Score 引擎。",
  "page.scores.eyebrow": "Atlas 评分",
  "page.scores.title": "评分排名",
  "page.scores.desc":
    "基于已披露财务数据的系统化多因子评分，覆盖全部跟踪公司。不构成投资建议。",
  "page.watchlist.eyebrow": "持仓",
  "page.watchlist.title": "自选",
  "page.watchlist.desc": "你关注的公司及其 Atlas 评分一览。数据保存在本地浏览器。",
  "page.portfolio.eyebrow": "持仓",
  "page.portfolio.title": "组合",
  "page.portfolio.desc":
    "你的持仓，按成本加权的敞口与 Atlas 评分质量。目前仅按成本计价 —— 市值与盈亏需接入实时行情（P027）。不构成投资建议。",
  "page.settings.eyebrow": "系统",
  "page.settings.title": "设置",
} as const;

/** The dictionary shape — English must satisfy exactly these keys. */
export type Dict = Record<keyof typeof zh, string>;

export const en: Dict = {
  "nav.workspace": "Workspace",
  "nav.home": "Home",
  "nav.companies": "Companies",
  "nav.industries": "Industries",
  "nav.valueChain": "Value Chain",
  "nav.markets": "Markets",
  "nav.trading": "Trading",
  "nav.news": "News",
  "nav.intelligence": "Intelligence",
  "nav.scores": "Rankings",
  "nav.watchlist": "Watchlist",
  "nav.portfolio": "Portfolio",
  "nav.alerts": "Alerts",
  "nav.knowledge": "Knowledge Graph",
  "nav.research": "Research",
  "nav.reports": "Reports",
  "nav.agent": "AI Analyst",
  "nav.enterprise": "Enterprise",
  "nav.erp": "ERP Intelligence",
  "nav.ceo": "CEO Dashboard",
  "nav.board": "Board",
  "nav.system": "System",
  "nav.agentOps": "Agent Ops",
  "nav.admin": "Admin",
  "nav.settings": "Settings",
  "nav.more": "More",
  "nav.allSections": "All sections",
  "nav.primaryMobile": "Primary mobile",

  "common.loading": "Loading…",
  "common.error": "Could not load",
  "common.retry": "Retry",
  "common.empty": "No data",
  "common.search": "Search",
  "common.searchCompanies": "Search companies",
  "common.filter": "Filter",
  "common.all": "All",
  "common.prev": "Prev",
  "common.next": "Next",
  "common.of": "of",
  "common.sample": "Sample data",
  "common.live": "Live",
  "common.notAdvice": "Research tool only. Not investment advice.",
  "common.awaitingData": "Awaiting data",
  "common.willRender": "Will render",
  "common.blockedOn": "Blocked on",
  "common.noFabrication":
    "Atlas never fabricates figures for a real company — this module stays empty until sourced data exists.",
  "common.source": "Source",
  "common.asOf": "As of",
  "common.language": "Language",

  "fin.revenue": "Revenue",
  "fin.grossProfit": "Gross profit",
  "fin.operatingIncome": "Operating income",
  "fin.netIncome": "Net income",
  "fin.eps": "EPS",
  "fin.totalAssets": "Total assets",
  "fin.totalEquity": "Total equity",
  "fin.totalDebt": "Total debt",
  "fin.operatingCashFlow": "Operating cash flow",
  "fin.capex": "Capex",
  "fin.freeCashFlow": "Free cash flow",
  "fin.grossMargin": "Gross margin",
  "fin.operatingMargin": "Operating margin",
  "fin.netMargin": "Net margin",
  "fin.revenueGrowth": "Revenue growth (YoY)",
  "fin.revenueCagr": "Revenue CAGR",
  "fin.roe": "Return on equity",
  "fin.fcfMargin": "FCF margin",
  "fin.cashConversion": "Cash conversion",
  "fin.debtToEquity": "Debt / equity",
  "fin.currentRatio": "Current ratio",
  "fin.quickRatio": "Quick ratio",
  "fin.interestCoverage": "Interest coverage",
  "fin.incomeStatement": "Income statement",
  "fin.balanceSheet": "Balance sheet",
  "fin.cashFlow": "Cash flow",
  "fin.annual": "Annual",
  "fin.quarterly": "Quarterly",

  "score.atlasScore": "Atlas Score",
  "score.grade": "Grade",
  "score.profitability": "Profitability",
  "score.growth": "Growth",
  "score.strength": "Financial strength",
  "score.cash": "Cash quality",
  "score.weight": "Weight",
  "score.rankings": "Rankings",
  "score.rankingsDesc":
    "Systematic multi-factor score across the coverage universe, computed from reported fundamentals. Not investment advice.",
  "score.leaderboard": "Atlas Score leaderboard",
  "score.methodology": "Methodology",

  "company.overview": "Overview",
  "company.profile": "Profile",
  "company.products": "Products",
  "company.management": "Management",
  "company.financials": "Financials",
  "company.relations": "Relations",
  "company.research": "Research",
  "company.valuation": "Valuation",
  "company.documents": "Documents",
  "company.timeline": "Timeline",
  "company.ticker": "Ticker",
  "company.exchange": "Exchange",
  "company.segment": "Segment",
  "company.country": "Country",

  "home.title": "Investment cockpit",
  "home.coverage": "Coverage",
  "home.topScores": "Top scores",
  "home.companies": "companies",
  "home.sectors": "sectors",
  "home.facts": "sourced facts",

  "page.home.eyebrow": "Decision Intelligence Platform",
  "page.home.title": "Atlas Invest",
  "page.home.desc":
    "Market change into evidence-backed decisions. Live coverage across AI infrastructure and rubber gloves — every figure sourced, every score reproducible, nothing fabricated.",
  "page.companies.eyebrow": "Company Intelligence",
  "page.companies.title": "Companies",
  "page.companies.desc":
    "The coverage universe. Profiles and financials are served by the Atlas API; scores come from the Atlas Score engine.",
  "page.scores.eyebrow": "Atlas Score",
  "page.scores.title": "Rankings",
  "page.scores.desc":
    "Systematic multi-factor score across the coverage universe, computed from reported fundamentals. Not investment advice.",
  "page.watchlist.eyebrow": "Positions",
  "page.watchlist.title": "Watchlist",
  "page.watchlist.desc":
    "Companies you follow, with their Atlas Score at a glance. Stored locally in your browser.",
  "page.portfolio.eyebrow": "Positions",
  "page.portfolio.title": "Portfolio",
  "page.portfolio.desc":
    "Your holdings with cost-weighted exposure and Atlas Score quality. Cost basis only — market value and P&L arrive with live prices (P027). Not investment advice.",
  "page.settings.eyebrow": "System",
  "page.settings.title": "Settings",
};

export const DICTIONARIES = { zh, en } as const;

export type Locale = keyof typeof DICTIONARIES;

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

/** Chinese first — the owner's working language. */
export const DEFAULT_LOCALE: Locale = "zh";
