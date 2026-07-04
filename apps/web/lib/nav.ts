/**
 * Navigation model for the Atlas shell (Milestone 1).
 *
 * Every entry is a real, routable link — `soon: true` only tags a module whose
 * page is an intentional placeholder, it does not disable the link. Company and
 * research sub-navigation is derived from the same model so the shell stays
 * data-driven and scalable.
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
        label: "Industries",
        href: "/industries",
        glyph: "ID",
        soon: true,
        description: "Industry and supply-chain intelligence.",
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
        soon: true,
        description: "Holdings and exposure (planned).",
      },
      {
        label: "Watchlist",
        href: "/watchlist",
        glyph: "WL",
        soon: true,
        description: "Tracked companies (planned).",
      },
      {
        label: "Alerts",
        href: "/alerts",
        glyph: "AL",
        soon: true,
        description: "Signal and event alerts (planned).",
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
        soon: true,
        description: "Workspace administration (planned).",
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
];
