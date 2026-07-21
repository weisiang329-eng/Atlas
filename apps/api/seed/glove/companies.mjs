/**
 * Glove sector identity — the P026 Phase 1 coverage (Malaysian glove makers
 * with real Bursa-sourced fundamentals in fundamentals.json).
 *
 * Tickers are Bursa Malaysia stock short names (the market convention).
 * Fiscal-year conventions differ per company; period labels come from the
 * source rows themselves, so no fiscal math happens here.
 */

export const GLOVE_INDUSTRY = {
  id: "rubber-gloves",
  name: "Rubber & Medical Gloves",
  sector: "Healthcare Manufacturing",
  description:
    "Disposable nitrile/latex glove manufacturers — a deeply cyclical industry driven by ASP, capacity utilisation, raw-material (NBR latex) and energy costs. Malaysia supplies the majority of world demand.",
};

export const GLOVE_COMPANIES = [
  {
    id: "top-glove",
    code: "TOPGLOV",
    name: "Top Glove Corporation",
    ticker: "TOPGLOV",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description:
      "The world's largest glove manufacturer by capacity (Bursa 7113). Fiscal year ends August.",
  },
  {
    id: "hartalega",
    code: "HARTA",
    name: "Hartalega Holdings",
    ticker: "HARTA",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description:
      "Nitrile glove pioneer with the industry's most automated plants (Bursa 5168). Fiscal year ends March.",
  },
  {
    id: "kossan",
    code: "KOSSAN",
    name: "Kossan Rubber Industries",
    ticker: "KOSSAN",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description:
      "Gloves plus technical rubber products; historically the most consistent margins of the big four (Bursa 7153).",
  },
  {
    id: "supermax",
    code: "SUPERMX",
    name: "Supermax Corporation",
    ticker: "SUPERMX",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description:
      "Own-brand distribution model (Bursa 7106) — direct channels in North America and Europe.",
  },
  {
    id: "careplus",
    code: "CAREPLS",
    name: "Careplus Group",
    ticker: "CAREPLS",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description: "Small-cap OEM glove manufacturer.",
  },
  {
    id: "comfort-gloves",
    code: "COMFORT",
    name: "Comfort Gloves",
    ticker: "COMFORT",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description: "Mid-cap nitrile glove manufacturer.",
  },
  {
    id: "hextar-healthcare",
    code: "HEXCARE",
    name: "Hextar Healthcare",
    ticker: "HEXCARE",
    exchange: "Bursa Malaysia",
    segment: "Rubber Gloves",
    country: "Malaysia",
    description: "Glove manufacturer (formerly Rubberex).",
  },
];
