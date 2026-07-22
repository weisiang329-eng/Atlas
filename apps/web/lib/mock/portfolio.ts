/**
 * MOCK portfolio data — P012 v1 UI scaffold. Same fictional-entity convention
 * as lib/mock/markets.ts. Replace with real holding/transaction rows once the
 * D1 tables + /v1/portfolios endpoints land (docs/design/P012).
 */
export interface MockHolding {
  ticker: string;
  name: string;
  assetClass: "Equities" | "Fixed Income" | "Crypto" | "Cash" | "Alternatives" | "Real Estate";
  qty: number;
  avgCost: number;
  price: number;
  currency: "USD" | "MYR";
}

export const MOCK_HOLDINGS: MockHolding[] = [
  { ticker: "HLXC", name: "Helios Compute Corp", assetClass: "Equities", qty: 10559, avgCost: 71.24, price: 172.4, currency: "USD" },
  { ticker: "ARFY", name: "Aurora Foundry", assetClass: "Equities", qty: 7912, avgCost: 133.6, price: 184.6, currency: "USD" },
  { ticker: "VTXM", name: "Vertex Memory", assetClass: "Equities", qty: 4120, avgCost: 96.8, price: 118.3, currency: "USD" },
  { ticker: "NMBS", name: "Nimbus Networks", assetClass: "Equities", qty: 3050, avgCost: 178.2, price: 242.1, currency: "USD" },
  { ticker: "SLPW", name: "Solstice Power & Cooling", assetClass: "Equities", qty: 8060, avgCost: 92.4, price: 89.25, currency: "USD" },
  { ticker: "MRGV", name: "Meridian Glove Bhd", assetClass: "Equities", qty: 220000, avgCost: 1.96, price: 2.14, currency: "MYR" },
  { ticker: "GOVT10Y", name: "US Treasury 10Y ladder", assetClass: "Fixed Income", qty: 1, avgCost: 1600000, price: 1640000, currency: "USD" },
  { ticker: "IGCB", name: "Investment-grade corp bond fund", assetClass: "Fixed Income", qty: 1, avgCost: 900000, price: 920000, currency: "USD" },
  { ticker: "PEFUND", name: "Private equity co-invest", assetClass: "Alternatives", qty: 1, avgCost: 1000000, price: 1120000, currency: "USD" },
  { ticker: "REIT1", name: "Logistics REIT basket", assetClass: "Real Estate", qty: 1, avgCost: 690000, price: 720000, currency: "USD" },
  { ticker: "CASH", name: "Cash & equivalents", assetClass: "Cash", qty: 1, avgCost: 988000, price: 988000, currency: "USD" },
];

export const ASSET_CLASS_COLOR: Record<MockHolding["assetClass"], string> = {
  Equities: "var(--accent)",
  "Fixed Income": "var(--info)",
  Crypto: "#c99b6e",
  Cash: "#8fa97e",
  Alternatives: "#9b7bb0",
  "Real Estate": "#4fb0a5",
};
