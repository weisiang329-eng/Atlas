/**
 * MOCK CEO dashboard data — P018 v1 UI scaffold. Cross-company KPI roll-up for
 * the owner's multiple businesses. Fictional sample entities. Replace with the
 * P014–P017 erp_metric aggregation once ERP ingestion lands.
 */
export interface CompanyKpi {
  id: string;
  name: string;
  kind: string;
  revenue: number;
  grossMarginPct: number;
  cash: number;
  yoyPct: number;
  asOf: string;
  stale?: boolean;
}

export const CEO_COMPANIES: CompanyKpi[] = [
  { id: "furniture", name: "晨光家具 Dawn Furniture", kind: "制造 · 家具", revenue: 4210000, grossMarginPct: 27.0, cash: 1120000, yoyPct: 12.4, asOf: "2026-06-30" },
  { id: "fnb", name: "小灶餐饮 Hearth F&B", kind: "餐饮 · 连锁", revenue: 2680000, grossMarginPct: 61.5, cash: 480000, yoyPct: 8.1, asOf: "2026-05-31", stale: true },
];

export const CASH_FLOW_6M = [
  { label: "1月", value: 180000 },
  { label: "2月", value: -60000 },
  { label: "3月", value: 220000 },
  { label: "4月", value: 140000 },
  { label: "5月", value: -30000 },
  { label: "6月", value: 260000 },
];
