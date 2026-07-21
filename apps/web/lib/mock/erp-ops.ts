/**
 * MOCK enterprise sub-module data — P015 Manufacturing, P016 Procurement,
 * P017 Warehouse. Fictional furniture-business sample; replace with real
 * factory_metric / purchase_order / inventory_snapshot aggregation.
 */

// P015 Manufacturing
export const MFG_KPIS = { utilization: 84, yield: 96.2, otd: 91, output: 12800 };
export const MFG_UTILIZATION_TREND = [
  { label: "1月", value: 79 }, { label: "2月", value: 81 }, { label: "3月", value: 83 },
  { label: "4月", value: 85 }, { label: "5月", value: 84 }, { label: "6月", value: 88 },
];

// P016 Procurement — purchase price vs commodity proxy
export const PROC_PRICE = [
  { label: "1月", value: 100 }, { label: "2月", value: 104 }, { label: "3月", value: 109 },
  { label: "4月", value: 112 }, { label: "5月", value: 111 }, { label: "6月", value: 116 },
];
export const PROC_COMMODITY = [
  { label: "1月", value: 100 }, { label: "2月", value: 106 }, { label: "3月", value: 114 },
  { label: "4月", value: 118 }, { label: "5月", value: 115 }, { label: "6月", value: 121 },
];
export interface SupplierRow {
  id: string; name: string; category: string; share: number; otd: number; risk: "single-source" | "price-drift" | "none";
}
export const SUPPLIERS: SupplierRow[] = [
  { id: "sp1", name: "北方木业", category: "实木板材", share: 62, otd: 88, risk: "single-source" },
  { id: "sp2", name: "华东五金", category: "五金件", share: 34, otd: 95, risk: "none" },
  { id: "sp3", name: "南海海绵", category: "填充材料", share: 41, otd: 79, risk: "price-drift" },
];

// P017 Warehouse
export const WH_KPIS = { totalValue: 1840000, dio: 68, turns: 5.4, deadstockValue: 210000 };
export interface DeadstockRow { id: string; sku: string; value: number; days: number; }
export const DEADSTOCK: DeadstockRow[] = [
  { id: "d1", sku: "储物边柜 B-150 (胡桃色)", value: 82000, days: 142 },
  { id: "d2", sku: "实木床架 BD-500 (加大)", value: 61000, days: 118 },
  { id: "d3", sku: "布艺沙发 S-340 (灰蓝)", value: 43000, days: 97 },
];
