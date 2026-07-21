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
    // What the owner opens every day. Deliberately short — if everything is
    // top-level, nothing is.
    title: "Daily",
    items: [
      {
        label: "Home",
        href: "/",
        glyph: "HM",
        description: "What changed, what needs a decision.",
      },
      {
        label: "Trade Ledger",
        href: "/ledger",
        glyph: "LG",
        description:
          "The book of record: trades, lots, average price and per-order realised P&L.",
      },
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
        description: "Companies you follow, with their Atlas Score.",
      },
      {
        label: "Markets",
        href: "/markets",
        glyph: "MK",
        description: "Quotes and index snapshot.",
      },
      {
        label: "News",
        href: "/news",
        glyph: "NW",
        description: "Tagged global and holdings news.",
      },
    ],
  },
  {
    // Deciding what to own: the analytical surface.
    title: "Research",
    items: [
      {
        label: "Companies",
        href: "/companies",
        glyph: "CO",
        description: "Profiles, financials and scores for the coverage universe.",
      },
      {
        label: "Rankings",
        href: "/scores",
        glyph: "AS",
        description: "The Atlas Score leaderboard.",
      },
      {
        label: "Financials",
        href: "/financials",
        glyph: "FN",
        description: "Statements, metrics, ratios and trends across companies.",
      },
      {
        label: "Industries",
        href: "/industries",
        glyph: "ID",
        description: "Cost factors, output prices and the margin cycle signal.",
      },
      {
        label: "Value Chain",
        href: "/value-chain",
        glyph: "VC",
        description: "The AI-hardware stack and its supply links.",
      },
      {
        label: "Knowledge",
        href: "/knowledge",
        glyph: "KG",
        description: "Supplier, customer and competitor relationships.",
      },
      {
        label: "Notes",
        href: "/research",
        glyph: "RS",
        description: "Research notes and the decision journal.",
      },
      {
        label: "Reports",
        href: "/reports",
        glyph: "RP",
        description: "Generated company and industry reports.",
      },
      {
        label: "Analyst",
        href: "/agent",
        glyph: "AI",
        description: "Ask Claude about the data in Atlas.",
      },
    ],
  },
  {
    // Acting on a decision. Separated from Daily because these move money.
    title: "Execution",
    items: [
      {
        label: "Trading",
        href: "/trading",
        glyph: "TR",
        description: "Order ticket and blotter. Manual confirm only.",
      },
      {
        label: "Alerts",
        href: "/alerts",
        glyph: "AL",
        description: "Price, metric and news rules.",
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
        description: "Company-wide operating view.",
      },
      {
        label: "ERP",
        href: "/erp",
        glyph: "ER",
        description: "Manufacturing, procurement and warehouse intelligence.",
      },
      {
        label: "Board",
        href: "/board",
        glyph: "BD",
        description: "Board-level risk and decision pack.",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Agent Ops",
        href: "/agents",
        glyph: "AG",
        description: "Agent runtime queue and traces.",
      },
      {
        label: "Admin",
        href: "/admin",
        glyph: "AD",
        description: "Users, audit log and data sources.",
      },
      {
        label: "Style Guide",
        href: "/style-guide",
        glyph: "SG",
        description: "The design system in living form.",
      },
      {
        label: "Settings",
        href: "/settings",
        glyph: "ST",
        description: "Language, theme and density.",
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
  "/research": "nav.notes",
  "/financials": "nav.financials",
  "/reports": "nav.reports",
  "/knowledge": "nav.knowledge",
  "/ledger": "nav.ledger",
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
  Daily: "nav.daily",
  Research: "nav.researchGroup",
  Execution: "nav.execution",
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
