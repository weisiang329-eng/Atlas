/**
 * MOCK industry intelligence data — P006 v1 UI scaffold (includes P026 glove
 * migration shape: commodity series + industry_metric). Fictional/sample per
 * repo convention; wholesale-replace when value_chain_node/commodity_series
 * D1 tables land.
 */
export interface ValueChainNode {
  stage: string;
  companies: string[]; // tickers
}

export const AI_INFRA_CHAIN: ValueChainNode[] = [
  { stage: "设计 Design", companies: ["HLXC", "NMBS"] },
  { stage: "制造 Foundry", companies: ["ARFY"] },
  { stage: "存储 Memory", companies: ["VTXM"] },
  { stage: "设备 Equipment", companies: [] },
  { stage: "网络 Networking", companies: ["NMBS"] },
  { stage: "电力冷却 Power & Cooling", companies: ["SLPW"] },
];

export const GLOVE_CHAIN: ValueChainNode[] = [
  { stage: "原料 NBR / 天然胶乳", companies: [] },
  { stage: "制造 Manufacturing", companies: ["MRGV"] },
  { stage: "分销 Distribution", companies: [] },
  { stage: "医疗/工业需求 Demand", companies: [] },
];

export interface CommodityPoint {
  label: string;
  value: number;
}

function series(n: number, start: number, drift: number, vol: number, seed: number): CommodityPoint[] {
  let v = start;
  let s = seed;
  const out: CommodityPoint[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = v * (1 + drift + r * vol);
    const dd = new Date(d);
    dd.setMonth(dd.getMonth() - (n - i));
    out.push({ label: `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`, value: Math.round(v * 100) / 100 });
  }
  return out;
}

export const COMMODITY_SERIES = {
  NBR: series(24, 1180, 0.004, 0.05, 11),
  USDMYR: series(24, 4.42, 0.001, 0.02, 23),
  MARGMA_ASP: series(24, 21.5, -0.002, 0.03, 7),
};

export interface IndustryCompareRow {
  ticker: string;
  name: string;
  revenueGrowthPct: number;
  grossMarginPct: number;
  utilizationPct: number;
  marketShare: number;
}

export const AI_INFRA_COMPARE: IndustryCompareRow[] = [
  { ticker: "HLXC", name: "Helios Compute Corp", revenueGrowthPct: 68.0, grossMarginPct: 64.3, utilizationPct: 92, marketShare: 0.31 },
  { ticker: "ARFY", name: "Aurora Foundry", revenueGrowthPct: 24.5, grossMarginPct: 41.2, utilizationPct: 88, marketShare: 0.22 },
  { ticker: "VTXM", name: "Vertex Memory", revenueGrowthPct: 12.1, grossMarginPct: 33.8, utilizationPct: 76, marketShare: 0.14 },
  { ticker: "NMBS", name: "Nimbus Networks", revenueGrowthPct: 41.7, grossMarginPct: 58.6, utilizationPct: 90, marketShare: 0.19 },
  { ticker: "SLPW", name: "Solstice Power & Cooling", revenueGrowthPct: 33.2, grossMarginPct: 37.4, utilizationPct: 81, marketShare: 0.11 },
];

export const GLOVE_COMPARE: IndustryCompareRow[] = [
  { ticker: "MRGV", name: "Meridian Glove Bhd", revenueGrowthPct: 6.8, grossMarginPct: 18.4, utilizationPct: 71, marketShare: 0.27 },
];
