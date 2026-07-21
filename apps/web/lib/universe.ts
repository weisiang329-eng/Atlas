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
];

export function getStaticCompany(id: string): CompanySummary | undefined {
  return STATIC_UNIVERSE.find((c) => c.id === id);
}
