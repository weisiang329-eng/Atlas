/**
 * MOCK ERP intelligence data — P014 v1 UI scaffold. Fictional sample for the
 * owner's furniture business. Replace with real erp_order/erp_customer/erp_sku
 * aggregation once the ERP adapter lands (docs/design/P014).
 */
export const ERP_REVENUE_BY_MONTH = [
  { label: "1月", value: 320000 },
  { label: "2月", value: 298000 },
  { label: "3月", value: 356000 },
  { label: "4月", value: 372000 },
  { label: "5月", value: 361000 },
  { label: "6月", value: 401000 },
];

export interface CustomerRow {
  id: string;
  name: string;
  revenue: number;
  sharePct: number;
  segment: string;
}

export const ERP_CUSTOMERS: CustomerRow[] = [
  { id: "c1", name: "Nordic Living AB", revenue: 620000, sharePct: 28.4, segment: "批发出口" },
  { id: "c2", name: "城市家居连锁", revenue: 410000, sharePct: 18.8, segment: "零售连锁" },
  { id: "c3", name: "Contract Hotels Group", revenue: 305000, sharePct: 14.0, segment: "工程项目" },
  { id: "c4", name: "电商平台直营", revenue: 268000, sharePct: 12.3, segment: "电商" },
  { id: "c5", name: "其他 (长尾)", revenue: 577000, sharePct: 26.5, segment: "混合" },
];

export interface SkuRow {
  id: string;
  name: string;
  category: string;
  revenue: number;
  grossMarginPct: number;
}

export const ERP_SKUS: SkuRow[] = [
  { id: "s1", name: "橡木餐桌 T-100", category: "餐桌", revenue: 288000, grossMarginPct: 34.2 },
  { id: "s2", name: "人体工学办公椅 C-220", category: "座椅", revenue: 246000, grossMarginPct: 41.8 },
  { id: "s3", name: "布艺三人沙发 S-340", category: "沙发", revenue: 210000, grossMarginPct: 22.6 },
  { id: "s4", name: "储物边柜 B-150", category: "柜类", revenue: 132000, grossMarginPct: 18.1 },
  { id: "s5", name: "实木床架 BD-500", category: "床具", revenue: 118000, grossMarginPct: 12.4 },
];

// Herfindahl-Hirschman Index over customer shares (backend-computed in real system).
export const CUSTOMER_HHI = Math.round(
  ERP_CUSTOMERS.reduce((a, c) => a + c.sharePct * c.sharePct, 0),
);
