/**
 * Industry knowledge model (Atlas OS V1 Book 2 — Industry Research Foundation).
 *
 * The manual's central discipline: every industry carries the SAME twenty
 * sections, so "what do we not know about this industry" becomes a computable
 * question instead of a judgement call. Its stated KPI is Knowledge
 * Completeness > 95%, which is only measurable against a fixed list.
 *
 * This fits how the rest of Atlas already behaves: the platform's first rule is
 * that missing data renders as missing. A completeness scorecard is that rule
 * turned into a metric — it makes the gaps the product surface rather than
 * something a reader has to notice for themselves.
 */

/** The twenty mandated sections, in the order the manual lists them. */
export const MANDATORY_SECTIONS = [
  "overview",
  "history",
  "marketSize",
  "marketStructure",
  "products",
  "applications",
  "images",
  "suppliers",
  "customers",
  "marketShare",
  "pricing",
  "demand",
  "supply",
  "capacity",
  "technology",
  "risks",
  "regulations",
  "timeline",
  "glossary",
  "kpis",
] as const;

export type IndustrySection = (typeof MANDATORY_SECTIONS)[number];

/** Human labels, both languages — the UI never invents its own. */
export const SECTION_LABELS: Record<
  IndustrySection,
  { en: string; zh: string }
> = {
  overview: { en: "Overview", zh: "行业概览" },
  history: { en: "History", zh: "发展历史" },
  marketSize: { en: "Market size", zh: "市场规模" },
  marketStructure: { en: "Market structure", zh: "市场结构" },
  products: { en: "Products", zh: "产品" },
  applications: { en: "Applications", zh: "应用场景" },
  images: { en: "Product images", zh: "产品图片" },
  suppliers: { en: "Suppliers", zh: "供应商" },
  customers: { en: "Customers", zh: "客户" },
  marketShare: { en: "Market share", zh: "市场份额" },
  pricing: { en: "Pricing", zh: "价格指标" },
  demand: { en: "Demand", zh: "需求" },
  supply: { en: "Supply", zh: "供给" },
  capacity: { en: "Capacity", zh: "产能" },
  technology: { en: "Technology", zh: "技术路线" },
  risks: { en: "Risks", zh: "风险" },
  regulations: { en: "Regulations", zh: "监管" },
  timeline: { en: "Timeline", zh: "时间线" },
  glossary: { en: "Glossary", zh: "术语表" },
  kpis: { en: "KPIs", zh: "行业 KPI" },
};

/**
 * Source priority from the manual, best first. Stored on each record so a
 * reader can weigh two conflicting values without re-researching them —
 * conflicts are kept with attribution, never silently resolved.
 */
export const SOURCE_PRIORITY = [
  "regulator",
  "industry-association",
  "company-filing",
  "company-website",
  "industry-provider",
  "financial-media",
] as const;

export interface KnowledgeRecord {
  section: string;
  content: string;
  kind: "fact" | "assumption";
  sourceUrl: string | null;
  confidence: number;
  asOf: string | null;
}

export interface SectionStatus {
  section: IndustrySection;
  labelEn: string;
  labelZh: string;
  /** How many records this section holds. Zero means a genuine gap. */
  recordCount: number;
  filled: boolean;
  /** Highest confidence among the section's records, or null when empty. */
  confidence: number | null;
  /** True when at least one record cites a source. */
  sourced: boolean;
  /** Records asserted as assumptions rather than facts. */
  assumptions: number;
}

export interface CompletenessReport {
  sections: SectionStatus[];
  /** Filled ÷ 20, as a percentage — the manual's Knowledge Completeness KPI. */
  completenessPct: number;
  /** Sourced ÷ filled, as a percentage — its Source Attribution KPI (target 100%). */
  attributionPct: number;
  filledCount: number;
  totalSections: number;
  missingSections: IndustrySection[];
}

/**
 * Score an industry's knowledge against the mandatory schema.
 *
 * Deliberately counts a section as "filled" on one record rather than trying to
 * judge depth: a metric that pretends to measure quality would be a fabricated
 * number in a platform whose first rule is not to fabricate. What this measures
 * honestly is presence, and presence is what the gaps list acts on.
 */
export function scoreCompleteness(
  records: KnowledgeRecord[],
): CompletenessReport {
  const bySection = new Map<string, KnowledgeRecord[]>();
  for (const r of records) {
    const list = bySection.get(r.section) ?? [];
    list.push(r);
    bySection.set(r.section, list);
  }

  const sections: SectionStatus[] = MANDATORY_SECTIONS.map((section) => {
    const rows = bySection.get(section) ?? [];
    const sourced = rows.some((r) => Boolean(r.sourceUrl));
    return {
      section,
      labelEn: SECTION_LABELS[section].en,
      labelZh: SECTION_LABELS[section].zh,
      recordCount: rows.length,
      filled: rows.length > 0,
      confidence: rows.length
        ? Math.max(...rows.map((r) => r.confidence))
        : null,
      sourced,
      assumptions: rows.filter((r) => r.kind === "assumption").length,
    };
  });

  const filled = sections.filter((s) => s.filled);
  const sourcedCount = filled.filter((s) => s.sourced).length;

  return {
    sections,
    completenessPct:
      Math.round((filled.length / MANDATORY_SECTIONS.length) * 1000) / 10,
    attributionPct: filled.length
      ? Math.round((sourcedCount / filled.length) * 1000) / 10
      : 0,
    filledCount: filled.length,
    totalSections: MANDATORY_SECTIONS.length,
    missingSections: sections.filter((s) => !s.filled).map((s) => s.section),
  };
}
