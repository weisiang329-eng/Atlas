/**
 * MOCK coverage universe — Milestone 1 placeholder data.
 *
 * These are real, public company identifiers (name / ticker / exchange /
 * segment) used only to shape the UI. NO fundamentals, prices, scores, or
 * research are fabricated — every metric field renders as "—" until a real
 * backend contract is wired. Anything sourced from here MUST be labelled as
 * sample data in the UI. Do not treat as a source of truth.
 */
export interface MockCompany {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  segment: string;
  country: string;
}

export const MOCK_COMPANIES: MockCompany[] = [
  {
    id: "nvidia",
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    exchange: "NASDAQ",
    segment: "GPU / AI Accelerators",
    country: "United States",
  },
  {
    id: "tsmc",
    name: "Taiwan Semiconductor Mfg.",
    ticker: "TSM",
    exchange: "NYSE (ADR)",
    segment: "Foundry",
    country: "Taiwan",
  },
  {
    id: "sk-hynix",
    name: "SK hynix",
    ticker: "000660",
    exchange: "KRX",
    segment: "HBM / DRAM",
    country: "South Korea",
  },
  {
    id: "asml",
    name: "ASML Holding",
    ticker: "ASML",
    exchange: "NASDAQ",
    segment: "Lithography",
    country: "Netherlands",
  },
  {
    id: "broadcom",
    name: "Broadcom",
    ticker: "AVGO",
    exchange: "NASDAQ",
    segment: "Networking / Custom ASIC",
    country: "United States",
  },
  {
    id: "vertiv",
    name: "Vertiv Holdings",
    ticker: "VRT",
    exchange: "NYSE",
    segment: "Data Center Power / Cooling",
    country: "United States",
  },
];

export function getMockCompany(id: string): MockCompany | undefined {
  return MOCK_COMPANIES.find((c) => c.id === id);
}
