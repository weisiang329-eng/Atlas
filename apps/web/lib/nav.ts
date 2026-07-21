/**
 * Navigation model for the Atlas shell (Milestone 1 + Aurora module adoption).
 *
 * Every entry is a real, routable link — `soon: true` only tags a module whose
 * page is an intentional placeholder, it does not disable the link. Company and
 * research sub-navigation is derived from the same model so the shell stays
 * data-driven and scalable.
 *
 * CHANGE (Aurora Phase 2b): added Markets, News, Trading, an Enterprise group
 * (CEO Dashboard, ERP, Board, Agent Ops), and removed the `soon` flag from
 * Alerts and Admin now that they are real (sample-data) workspaces. "Agent Ops"
 * (`/agents`) is the P020 agent-runtime queue view — distinct from "Analyst"
 * (`/agent`), the live Claude research chat.
 */
export interface NavItem {
  label: string;
  href: string;
  /** Two-letter mono glyph for the collapsed rail; text, not an icon library. */
  glyph: string;
  /** Placeholder module (renders a "coming soon" page) vs a built workspace. */
  soon?: boolean;
  description: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      {
        label: "Home",
        href: "/",
        glyph: "HM",
        description: "Platform overview and status.",
      },
      {
        label: "Companies",
        href: "/companies",
        glyph: "CO",
        description: "Company intelligence workspace.",
      },
      {
        label: "Markets",
        href: "/markets",
        glyph: "MK",
        description: "Live-simulated quotes, intraday and candlestick charts (sample data).",
      },
      {
        label: "News",
        href: "/news",
        glyph: "NW",
        description: "News intelligence feed, tagged and prioritized (sample data).",
      },
      {
        label: "Industries",
        href: "/industries",
        glyph: "ID",
        description: "Industry and supply-chain intelligence.",
      },
      {
        label: "Value Chain",
        href: "/value-chain",
        glyph: "VC",
        description: "The AI-hardware stack and its supply links.",
      },
      {
        label: "Rankings",
        href: "/scores",
        glyph: "AS",
        description: "Atlas Score leaderboard across the coverage universe.",
      },
      {
        label: "Analyst",
        href: "/agent",
        glyph: "AI",
        description: "AI research analyst — ask questions about the data.",
      },
      {
        label: "Research",
        href: "/research",
        glyph: "RS",
        description: "Research notes, reports and evidence.",
      },
      {
        label: "Financials",
        href: "/financials",
        glyph: "FN",
        description: "Statements, metrics and results (sample data).",
      },
      {
        label: "Reports",
        href: "/reports",
        glyph: "RP",
        description: "Intelligence reports and decision documents.",
      },
      {
        label: "Knowledge",
        href: "/knowledge",
        glyph: "KG",
        description: "Relationships, exposure and decision structure.",
      },
    ],
  },
  {
    title: "Positions",
    items: [
      {
        label: "Portfolio",
        href: "/portfolio",
        glyph: "PF",
        description: "Holdings, cost-weighted exposure and quality.",
      },
      {
        label: "Watchlist",
        href: "/watchlist",
        glyph: "WL",
        description: "Tracked companies with Atlas Score.",
      },
      {
        label: "Alerts",
        href: "/alerts",
        glyph: "AL",
        description: "Rule-triggered alert feed (sample data).",
      },
      {
        label: "Trading",
        href: "/trading",
        glyph: "TR",
        description: "Paper order execution, manual-confirm only (sample data).",
      },
    ],
  },
  {
    title: "Enterprise",
    items: [
      {
        label: "CEO Dashboard",
        href: "/ceo",
        glyph: "CE",
        description: "Cross-company KPI roll-up (sample data).",
      },
      {
        label: "ERP",
        href: "/erp",
        glyph: "ER",
        description: "ERP intelligence — revenue/SKU/customers (sample data).",
      },
      {
        label: "Board",
        href: "/board",
        glyph: "BD",
        description: "Risk matrix, register and board packs (sample data).",
      },
      {
        label: "Agent Ops",
        href: "/agents",
        glyph: "AG",
        description: "Agent runtime task queue — distinct from Analyst (sample data).",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Style Guide",
        href: "/style-guide",
        glyph: "SG",
        description: "Living design-system gallery.",
      },
      {
        label: "Admin",
        href: "/admin",
        glyph: "AD",
        description: "Workspace administration — users, audit log (sample data).",
      },
      {
        label: "Settings",
        href: "/settings",
        glyph: "ST",
        description: "Appearance and preferences.",
      },
    ],
  },
];

export interface SubTab {
  label: string;
  href: string;
}

/** Company detail sub-navigation. Mirrors the `company_*` data-model groups. */
export function companyTabs(companyId: string): SubTab[] {
  const base = `/companies/${companyId}`;
  return [
    { label: "Overview", href: `${base}/overview` },
    { label: "Profile", href: `${base}/profile` },
    { label: "Products", href: `${base}/products` },
    { label: "Management", href: `${base}/management` },
    { label: "Financials", href: `${base}/financials` },
    { label: "Relations", href: `${base}/relations` },
    { label: "Research", href: `${base}/research` },
    { label: "Valuation", href: `${base}/valuation` },
    { label: "Documents", href: `${base}/documents` },
    { label: "Timeline", href: `${base}/timeline` },
  ];
}

/** Knowledge workspace sub-navigation. */
export const KNOWLEDGE_TABS: SubTab[] = [
  { label: "Overview", href: "/knowledge" },
  { label: "Relationship Graph", href: "/knowledge/graph" },
  { label: "Heatmap", href: "/knowledge/heatmap" },
  { label: "Decision Tree", href: "/knowledge/decision-tree" },
  { label: "Memory", href: "/knowledge/memory" },
];

/** Financial workspace sub-navigation. */
export const FINANCIAL_TABS: SubTab[] = [
  { label: "Overview", href: "/financials" },
  { label: "Income Statement", href: "/financials/income-statement" },
  { label: "Balance Sheet", href: "/financials/balance-sheet" },
  { label: "Cash Flow", href: "/financials/cash-flow" },
  { label: "Metrics", href: "/financials/metrics" },
  { label: "Ratios", href: "/financials/ratios" },
  { label: "Historical Trends", href: "/financials/historical-trends" },
  { label: "Quarterly", href: "/financials/quarterly" },
  { label: "Annual", href: "/financials/annual" },
];

/** Research workspace sub-navigation. Mirrors the `research_*` data-model groups. */
export const RESEARCH_TABS: SubTab[] = [
  { label: "Overview", href: "/research" },
  { label: "Notes", href: "/research/notes" },
  { label: "Reports", href: "/research/reports" },
  { label: "Evidence", href: "/research/evidence" },
  { label: "Versions", href: "/research/versions" },
  { label: "Hypotheses", href: "/research/hypotheses" },
  { label: "Decision Journal", href: "/research/decision-journal" },
  { label: "Learning", href: "/research/learning" },
];

/** Markets workspace sub-navigation (sample data). */
export const MARKETS_TABS: SubTab[] = [{ label: "Watchlist", href: "/markets" }];

/* ────────────────────────────────────────────────────────────────────────
 * Localisation
 *
 * The nav model above stays the structural source of truth (routes, glyphs,
 * ordering). Display strings are looked up by href / group title so the
 * structure never has to be duplicated per language — a new route needs one
 * entry above and one key here.
 *
 * A missing entry falls back to the English literal in the model, so the nav
 * always renders even mid-migration.
 * ──────────────────────────────────────────────────────────────────────── */
import type { Dict } from "@/lib/i18n/dictionary";

/** href → dictionary key for top-level nav items. */
export const NAV_ITEM_KEYS: Record<string, keyof Dict> = {
  "/": "nav.home",
  "/companies": "nav.companies",
  "/markets": "nav.markets",
  "/news": "nav.news",
  "/industries": "nav.industries",
  "/value-chain": "nav.valueChain",
  "/scores": "nav.scores",
  "/agent": "nav.agent",
  "/research": "nav.research",
  "/financials": "fin.incomeStatement",
  "/reports": "nav.reports",
  "/knowledge": "nav.knowledge",
  "/portfolio": "nav.portfolio",
  "/watchlist": "nav.watchlist",
  "/alerts": "nav.alerts",
  "/trading": "nav.trading",
  "/ceo": "nav.ceo",
  "/erp": "nav.erp",
  "/board": "nav.board",
  "/agents": "nav.agentOps",
  "/admin": "nav.admin",
  "/settings": "nav.settings",
};

/** Group title (as written in NAV_GROUPS) → dictionary key. */
export const NAV_GROUP_KEYS: Record<string, keyof Dict> = {
  Workspace: "nav.workspace",
  Intelligence: "nav.intelligence",
  Positions: "nav.portfolio",
  Enterprise: "nav.enterprise",
  System: "nav.system",
};

/** Company sub-tab href suffix → dictionary key. */
export const COMPANY_TAB_KEYS: Record<string, keyof Dict> = {
  overview: "company.overview",
  profile: "company.profile",
  products: "company.products",
  management: "company.management",
  financials: "company.financials",
  relations: "company.relations",
  research: "company.research",
  valuation: "company.valuation",
  documents: "company.documents",
  timeline: "company.timeline",
};
