/**
 * Three-layer navigation model.
 *
 *   Layer 1  Section   — a heading, not a link ("DAILY", "RESEARCH")
 *   Layer 2  Module    — a destination, optionally with children ("Companies")
 *   Layer 3  Sub-page  — a page inside a module ("Income statement")
 *
 * The previous model was two flat layers, which forced twelve unrelated
 * destinations into one list and left every sub-page invisible until you were
 * already inside its module. Sub-navigation living in the sidebar means the
 * whole product is visible from anywhere.
 *
 * `lib/nav.ts` remains for the legacy flat consumers (command search, the
 * mobile drawer's key map); this tree is the shape the sidebar renders.
 */
import type { Dict } from "@/lib/i18n/dictionary";

export interface NavLeaf {
  /** Route. Layer-2 entries with children still navigate to their own page. */
  href: string;
  labelKey: keyof Dict;
  /** Fallback if the dictionary key is missing. */
  label: string;
  /** Two-letter monogram — quiet texture, and the collapsed-rail affordance. */
  glyph?: string;
  children?: NavLeaf[];
}

export interface NavSection {
  titleKey: keyof Dict;
  title: string;
  items: NavLeaf[];
}

export const NAV_TREE: NavSection[] = [
  {
    title: "Daily",
    titleKey: "nav.daily",
    items: [
      { href: "/", label: "Home", labelKey: "nav.home", glyph: "HM" },
      {
        href: "/ledger",
        label: "Trade Ledger",
        labelKey: "nav.ledger",
        glyph: "LG",
      },
      {
        href: "/portfolio",
        label: "Portfolio",
        labelKey: "nav.portfolio",
        glyph: "PF",
      },
      {
        href: "/watchlist",
        label: "Watchlist",
        labelKey: "nav.watchlist",
        glyph: "WL",
      },
      { href: "/markets", label: "Markets", labelKey: "nav.markets", glyph: "MK" },
      { href: "/news", label: "News", labelKey: "nav.news", glyph: "NW" },
    ],
  },
  {
    title: "Research",
    titleKey: "nav.researchGroup",
    items: [
      {
        href: "/companies",
        label: "Companies",
        labelKey: "nav.companies",
        glyph: "CO",
      },
      {
        href: "/financials",
        label: "Financials",
        labelKey: "nav.financials",
        glyph: "FN",
        children: [
          {
            href: "/financials/income-statement",
            label: "Income statement",
            labelKey: "fin.incomeStatement",
          },
          {
            href: "/financials/balance-sheet",
            label: "Balance sheet",
            labelKey: "fin.balanceSheet",
          },
          {
            href: "/financials/cash-flow",
            label: "Cash flow",
            labelKey: "fin.cashFlow",
          },
          { href: "/financials/metrics", label: "Metrics", labelKey: "nav.metrics" },
          { href: "/financials/ratios", label: "Ratios", labelKey: "nav.ratios" },
          {
            href: "/financials/historical-trends",
            label: "Trends",
            labelKey: "nav.trends",
          },
        ],
      },
      { href: "/scores", label: "Rankings", labelKey: "nav.scores", glyph: "AS" },
      {
        href: "/industries",
        label: "Industries",
        labelKey: "nav.industries",
        glyph: "ID",
      },
      {
        href: "/value-chain",
        label: "Value Chain",
        labelKey: "nav.valueChain",
        glyph: "VC",
      },
      {
        href: "/knowledge",
        label: "Knowledge",
        labelKey: "nav.knowledge",
        glyph: "KG",
        children: [
          { href: "/knowledge/graph", label: "Graph", labelKey: "nav.graph" },
          { href: "/knowledge/heatmap", label: "Heatmap", labelKey: "nav.heatmap" },
          { href: "/knowledge/memory", label: "Memory", labelKey: "nav.memory" },
        ],
      },
      {
        href: "/research",
        label: "Notes",
        labelKey: "nav.notes",
        glyph: "RS",
        children: [
          { href: "/research/notes", label: "Notes", labelKey: "nav.notes" },
          {
            href: "/research/decision-journal",
            label: "Decision journal",
            labelKey: "nav.decisions",
          },
          { href: "/research/evidence", label: "Evidence", labelKey: "nav.evidence" },
          {
            href: "/research/hypotheses",
            label: "Hypotheses",
            labelKey: "nav.hypotheses",
          },
        ],
      },
      { href: "/reports", label: "Reports", labelKey: "nav.reports", glyph: "RP" },
      { href: "/agent", label: "Analyst", labelKey: "nav.agent", glyph: "AI" },
    ],
  },
  {
    title: "Execution",
    titleKey: "nav.execution",
    items: [
      { href: "/trading", label: "Trading", labelKey: "nav.trading", glyph: "TR" },
      { href: "/alerts", label: "Alerts", labelKey: "nav.alerts", glyph: "AL" },
    ],
  },
  {
    title: "Enterprise",
    titleKey: "nav.enterprise",
    items: [
      { href: "/ceo", label: "CEO Dashboard", labelKey: "nav.ceo", glyph: "CE" },
      {
        href: "/erp",
        label: "ERP",
        labelKey: "nav.erp",
        glyph: "ER",
        children: [
          {
            href: "/erp/manufacturing",
            label: "Manufacturing",
            labelKey: "nav.manufacturing",
          },
          {
            href: "/erp/procurement",
            label: "Procurement",
            labelKey: "nav.procurement",
          },
          { href: "/erp/warehouse", label: "Warehouse", labelKey: "nav.warehouse" },
          { href: "/erp/furniture", label: "Furniture", labelKey: "nav.furniture" },
        ],
      },
      { href: "/board", label: "Board", labelKey: "nav.board", glyph: "BD" },
    ],
  },
  {
    title: "System",
    titleKey: "nav.system",
    items: [
      {
        href: "/agents",
        label: "Agent Ops",
        labelKey: "nav.agentOps",
        glyph: "AG",
        children: [
          { href: "/admin/ingest", label: "Ingestion", labelKey: "nav.ingest" },
          {
            href: "/admin/automation",
            label: "Automation",
            labelKey: "nav.automation",
          },
        ],
      },
      { href: "/admin", label: "Admin", labelKey: "nav.admin", glyph: "AD" },
      {
        href: "/settings",
        label: "Settings",
        labelKey: "nav.settings",
        glyph: "ST",
      },
    ],
  },
];

/** True when `href` is the active route or an ancestor of it. */
export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** True when any descendant of this item is the active route. */
export function hasActiveChild(pathname: string, item: NavLeaf): boolean {
  return (item.children ?? []).some((c) => isRouteActive(pathname, c.href));
}
