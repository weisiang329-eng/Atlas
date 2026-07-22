/**
 * Static coverage universe — the build-time snapshot of seeded companies.
 *
 * Two jobs in a static-export site:
 *   1. `generateStaticParams` for /companies/[companyId]/* — every company
 *      page that must exist as static HTML is listed here.
 *   2. Instant first paint for universe-level UI (lists, headers) before the
 *      live fetch resolves — and the whole answer when no API is configured.
 *
 * Keep in sync with apps/api/seed/data.mjs when coverage grows. Company-level
 * *figures* never live here — only identity fields.
 */
import type { CompanySummary } from "./types";

export const STATIC_UNIVERSE: CompanySummary[] = [
  { id: "nvidia", name: "NVIDIA Corporation", ticker: "NVDA", exchange: "NASDAQ", segment: "GPU / AI Accelerators", country: "United States" },
  { id: "tsmc", name: "Taiwan Semiconductor Mfg.", ticker: "TSM", exchange: "NYSE (ADR)", segment: "Foundry", country: "Taiwan" },
  { id: "amd", name: "Advanced Micro Devices", ticker: "AMD", exchange: "NASDAQ", segment: "CPU / GPU / AI Accelerators", country: "United States" },
  { id: "asml", name: "ASML Holding", ticker: "ASML", exchange: "NASDAQ", segment: "Lithography", country: "Netherlands" },
  { id: "broadcom", name: "Broadcom", ticker: "AVGO", exchange: "NASDAQ", segment: "Networking / Custom ASIC", country: "United States" },
  { id: "micron", name: "Micron Technology", ticker: "MU", exchange: "NASDAQ", segment: "Memory (DRAM / NAND / HBM)", country: "United States" },
  { id: "sk-hynix", name: "SK hynix", ticker: "000660", exchange: "KRX", segment: "HBM / DRAM", country: "South Korea" },
  { id: "intel", name: "Intel Corporation", ticker: "INTC", exchange: "NASDAQ", segment: "CPU / Foundry", country: "United States" },
  { id: "arista", name: "Arista Networks", ticker: "ANET", exchange: "NYSE", segment: "Data Center Networking", country: "United States" },
  { id: "vertiv", name: "Vertiv Holdings", ticker: "VRT", exchange: "NYSE", segment: "Data Center Power / Cooling", country: "United States" },
  // Rubber & medical gloves (P026 glove-tracker merge, Phase 1).
  { id: "top-glove", name: "Top Glove Corporation", ticker: "TOPGLOV", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
  { id: "hartalega", name: "Hartalega Holdings", ticker: "HARTA", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
  { id: "kossan", name: "Kossan Rubber Industries", ticker: "KOSSAN", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
  { id: "supermax", name: "Supermax Corporation", ticker: "SUPERMX", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
  { id: "careplus", name: "Careplus Group", ticker: "CAREPLS", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
  { id: "comfort-gloves", name: "Comfort Gloves", ticker: "COMFORT", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
  { id: "hextar-healthcare", name: "Hextar Healthcare", ticker: "HEXCARE", exchange: "Bursa Malaysia", segment: "Rubber Gloves", country: "Malaysia" },
];

export function getStaticCompany(id: string): CompanySummary | undefined {
  return STATIC_UNIVERSE.find((c) => c.id === id);
}

/** Static industry snapshot — generateStaticParams for /industries/[id]. */
export interface StaticIndustry {
  id: string;
  name: string;
  sector: string;
}

export const STATIC_INDUSTRIES: StaticIndustry[] = [
  { id: "semis-accelerators", name: "AI Accelerators & GPUs", sector: "Semiconductors" },
  { id: "semis-foundry", name: "Foundry & IDM", sector: "Semiconductors" },
  { id: "semis-memory", name: "Memory (HBM / DRAM / NAND)", sector: "Semiconductors" },
  { id: "semis-equipment", name: "Semiconductor Equipment", sector: "Semiconductors" },
  { id: "networking", name: "Networking & Custom ASIC", sector: "AI Infrastructure" },
  { id: "dc-power-cooling", name: "Data Center Power & Cooling", sector: "AI Infrastructure" },
  { id: "rubber-gloves", name: "Rubber & Medical Gloves", sector: "Healthcare Manufacturing" },
];

/**
 * Every OTHER node in the taxonomy — roots, chain segments, sub-industries.
 *
 * These have to be here or they do not exist. The site is a STATIC EXPORT, so
 * `generateStaticParams` is the complete list of pages that will be written;
 * an id missing from it is a link the tree renders and a 404 the visitor
 * gets. Adding 14 nodes in the taxonomy PR silently did exactly that — the
 * build kept reporting 256 pages and nobody noticed the new branches led
 * nowhere.
 *
 * Mirrors `apps/api/seed/taxonomy.mjs`; `test-taxonomy.mjs` fails if the two
 * drift, so this list cannot quietly fall behind the tree again.
 */
export const STATIC_TAXONOMY_NODES: string[] = [
  "sector-technology",
  "sector-healthcare",
  "chain-semiconductors",
  "chain-ai-infrastructure",
  "chain-medical-consumables",
  "memory-dram",
  "memory-nand",
  "memory-hbm",
  "foundry-advanced",
  "foundry-mature",
  "equipment-frontend",
  "equipment-backend",
  "gloves-nitrile",
  "gloves-natural",
];

/** Every industry page the static export must emit. */
export const ALL_INDUSTRY_IDS: string[] = [
  ...STATIC_INDUSTRIES.map((i) => i.id),
  ...STATIC_TAXONOMY_NODES,
];
