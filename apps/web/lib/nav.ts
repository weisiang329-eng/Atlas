/**
 * Navigation model for the Atlas shell.
 *
 * Sprint 000 only wires the three foundation routes (home, company, dashboard).
 * The remaining Atlas modules are listed as `status: "planned"` so the sidebar
 * already reflects the long-term platform shape without shipping any feature.
 */
export type NavStatus = "live" | "planned";

export interface NavItem {
  label: string;
  href: string;
  /** Short glyph shown in the collapsed rail; intentionally text, not an icon lib. */
  glyph: string;
  status: NavStatus;
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
        label: "Overview",
        href: "/",
        glyph: "AT",
        status: "live",
        description: "Platform status and foundation summary.",
      },
      {
        label: "Dashboard",
        href: "/dashboard",
        glyph: "DB",
        status: "live",
        description: "Research terminal workspace (placeholder).",
      },
      {
        label: "Company",
        href: "/company",
        glyph: "CO",
        status: "live",
        description: "Company profile scaffold (placeholder).",
      },
    ],
  },
  {
    title: "Modules",
    items: [
      {
        label: "Atlas Invest",
        href: "/invest",
        glyph: "IN",
        status: "planned",
        description: "Public company and investment research.",
      },
      {
        label: "Atlas Industry",
        href: "/industry",
        glyph: "ID",
        status: "planned",
        description: "Industry and supply-chain intelligence.",
      },
      {
        label: "Atlas ERP",
        href: "/erp",
        glyph: "ER",
        status: "planned",
        description: "Internal business performance intelligence.",
      },
      {
        label: "Atlas M&A",
        href: "/ma",
        glyph: "MA",
        status: "planned",
        description: "Acquisition target and synergy analysis.",
      },
      {
        label: "Atlas Board",
        href: "/board",
        glyph: "BD",
        status: "planned",
        description: "Board packs, KPI reviews and strategic memos.",
      },
    ],
  },
];
