/**
 * MOCK financial data — Milestone 1.2.
 *
 * The subject is a FICTIONAL entity ("Helios Compute Corp"), deliberately not a
 * real company, so no figure can be mistaken for reported fundamentals. Values
 * are pre-baked constants — nothing here is calculated, and no ratios or
 * valuations are derived. Exists only to exercise the table and chart
 * architecture. Replace wholesale when a financial-data contract lands.
 */
import type { StatementRow } from "@/components/data/statement-table";
import type { SeriesPoint } from "@/components/chart/trend-chart";

export const FIN_SUBJECT = {
  name: "Helios Compute Corp",
  ticker: "HLXC",
  note: "Fictional sample entity",
} as const;

export const ANNUAL_PERIODS = ["FY21", "FY22", "FY23", "FY24"];
export const QUARTER_PERIODS = ["Q1 FY24", "Q2 FY24", "Q3 FY24", "Q4 FY24"];

export const INCOME_STATEMENT: StatementRow[] = [
  { label: "Revenue", kind: "section", values: [] },
  { label: "Product", indent: true, values: [3000, 4900, 9200, 15600] },
  { label: "Services", indent: true, values: [1200, 1900, 3300, 5400] },
  { label: "Total revenue", kind: "total", values: [4200, 6800, 12500, 21000] },
  { label: "Costs & expenses", kind: "section", values: [] },
  { label: "Cost of revenue", indent: true, values: [-1700, -2600, -4600, -7500] },
  { label: "Research & development", indent: true, values: [-700, -1000, -1700, -2600] },
  { label: "Sales & marketing", indent: true, values: [-500, -720, -1150, -1750] },
  { label: "General & administrative", indent: true, values: [-260, -380, -600, -900] },
  { label: "Total costs & expenses", kind: "total", values: [-3160, -4700, -8050, -12750] },
  { label: "Operating income", kind: "total", values: [1040, 2100, 4450, 8250] },
  { label: "Interest & other, net", values: [-40, -60, -90, -120] },
  { label: "Income tax", values: [-150, -306, -654, -1220] },
  { label: "Net income", kind: "total", values: [850, 1734, 3706, 6910] },
];

export const BALANCE_SHEET: StatementRow[] = [
  { label: "Assets", kind: "section", values: [] },
  { label: "Cash & equivalents", indent: true, values: [1800, 3200, 6100, 11200] },
  { label: "Accounts receivable", indent: true, values: [700, 1100, 2000, 3400] },
  { label: "Inventory", indent: true, values: [400, 650, 1150, 1900] },
  { label: "Property & equipment", indent: true, values: [900, 1300, 2100, 3300] },
  { label: "Goodwill & intangibles", indent: true, values: [500, 520, 900, 1400] },
  { label: "Total assets", kind: "total", values: [4300, 6770, 12250, 21200] },
  { label: "Liabilities", kind: "section", values: [] },
  { label: "Accounts payable", indent: true, values: [400, 620, 1050, 1700] },
  { label: "Long-term debt", indent: true, values: [1000, 1000, 1500, 1500] },
  { label: "Other liabilities", indent: true, values: [300, 450, 800, 1300] },
  { label: "Total liabilities", kind: "total", values: [1700, 2070, 3350, 4500] },
  { label: "Equity", kind: "section", values: [] },
  { label: "Total equity", kind: "total", values: [2600, 4700, 8900, 16700] },
];

export const CASH_FLOW: StatementRow[] = [
  { label: "Operating", kind: "section", values: [] },
  { label: "Net income", indent: true, values: [850, 1734, 3706, 6910] },
  { label: "Depreciation & amortization", indent: true, values: [200, 280, 450, 700] },
  { label: "Change in working capital", indent: true, values: [-120, -260, -480, -760] },
  { label: "Cash from operations", kind: "total", values: [930, 1754, 3676, 6850] },
  { label: "Investing", kind: "section", values: [] },
  { label: "Capital expenditure", indent: true, values: [-350, -520, -900, -1500] },
  { label: "Acquisitions & investments", indent: true, values: [-80, -40, -300, -500] },
  { label: "Cash from investing", kind: "total", values: [-430, -560, -1200, -2000] },
  { label: "Financing", kind: "section", values: [] },
  { label: "Share repurchases", indent: true, values: [-100, -150, -400, -800] },
  { label: "Debt issued / (repaid)", indent: true, values: [0, 0, 500, 0] },
  { label: "Cash from financing", kind: "total", values: [-100, -150, 100, -800] },
  { label: "Net change in cash", kind: "total", values: [400, 1044, 2576, 4050] },
];

export interface MetricRow {
  label: string;
  latest: string;
  series: number[];
}

export const METRICS: MetricRow[] = [
  { label: "Gross margin", latest: "64.3%", series: [59.5, 61.8, 63.2, 64.3] },
  { label: "Operating margin", latest: "39.3%", series: [24.8, 30.9, 35.6, 39.3] },
  { label: "Net margin", latest: "32.9%", series: [20.2, 25.5, 29.6, 32.9] },
  { label: "Revenue growth (YoY)", latest: "68.0%", series: [45.0, 61.9, 83.8, 68.0] },
  { label: "Free cash flow margin", latest: "25.5%", series: [13.8, 18.1, 22.2, 25.5] },
  { label: "Return on equity", latest: "41.4%", series: [32.7, 36.9, 41.6, 41.4] },
];

export const TREND_REVENUE: SeriesPoint[] = ANNUAL_PERIODS.map((label, i) => ({
  label,
  value: [4200, 6800, 12500, 21000][i]!,
}));
export const TREND_NET_INCOME: SeriesPoint[] = ANNUAL_PERIODS.map((label, i) => ({
  label,
  value: [850, 1734, 3706, 6910][i]!,
}));
export const TREND_FCF: SeriesPoint[] = ANNUAL_PERIODS.map((label, i) => ({
  label,
  value: [580, 1234, 2776, 5350][i]!,
}));

export interface ResultRow {
  id: string;
  period: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
}

// Deterministic synthetic rows — filler to exercise table paging and large-set
// rendering. NOT financial computation; every column is fabricated placeholder.
function synthResults(count: number, startFiscalYear: number): ResultRow[] {
  const rows = Array.from({ length: count }, (_, i) => {
    const year = startFiscalYear + Math.floor(i / 4);
    const q = (i % 4) + 1;
    const base = 300 + i * 40 + i * i * 0.8;
    const revenue = Math.round(base);
    return {
      id: `r${i}`,
      period: `Q${q} FY${year}`,
      revenue,
      grossProfit: Math.round(base * 0.62),
      operatingIncome: Math.round(base * 0.36),
      netIncome: Math.round(base * 0.3),
      eps: Number(((base * 0.3) / 1500).toFixed(2)),
    };
  });
  return rows.reverse();
}

export const QUARTERLY_RESULTS: ResultRow[] = synthResults(48, 13);

export const ANNUAL_RESULTS: ResultRow[] = Array.from({ length: 12 }, (_, i) => {
  const year = 13 + i;
  const base = 1500 + i * 1600 + i * i * 120;
  return {
    id: `a${i}`,
    period: `FY${year}`,
    revenue: Math.round(base),
    grossProfit: Math.round(base * 0.62),
    operatingIncome: Math.round(base * 0.37),
    netIncome: Math.round(base * 0.31),
    eps: Number(((base * 0.31) / 1500).toFixed(2)),
  };
}).reverse();
