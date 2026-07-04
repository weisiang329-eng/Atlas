/**
 * MOCK financial ratios — P004 Ratio Dashboard. Illustrative sample values only.
 * Ratios are NOT computed in the UI; the Ratio Engine (backend, P004) produces
 * them. This is display data grouped by category. Valuation multiples are out of
 * P004 scope (a separate planned module) and intentionally excluded.
 */
import type { KpiDirection } from "@/components/ui/kpi-card";

export interface Ratio {
  label: string;
  value: string;
  delta?: string;
  direction?: KpiDirection;
  series?: number[];
}

export interface RatioGroup {
  title: string;
  description: string;
  ratios: Ratio[];
}

export const RATIO_GROUPS: RatioGroup[] = [
  {
    title: "Profitability",
    description: "How much of revenue converts to profit.",
    ratios: [
      { label: "Gross margin", value: "64.3%", delta: "+1.1pt", direction: "up", series: [59.5, 61.8, 63.2, 64.3] },
      { label: "Operating margin", value: "39.3%", delta: "+3.7pt", direction: "up", series: [24.8, 30.9, 35.6, 39.3] },
      { label: "Net margin", value: "32.9%", delta: "+3.3pt", direction: "up", series: [20.2, 25.5, 29.6, 32.9] },
      { label: "Return on equity", value: "41.4%", delta: "-0.2pt", direction: "down", series: [32.7, 36.9, 41.6, 41.4] },
    ],
  },
  {
    title: "Liquidity",
    description: "Ability to cover short-term obligations.",
    ratios: [
      { label: "Current ratio", value: "3.1x", delta: "+0.2x", direction: "up", series: [2.4, 2.7, 2.9, 3.1] },
      { label: "Quick ratio", value: "2.4x", series: [1.8, 2.0, 2.2, 2.4] },
      { label: "Cash ratio", value: "1.8x", series: [1.1, 1.3, 1.6, 1.8] },
    ],
  },
  {
    title: "Leverage",
    description: "Balance-sheet risk. The company runs net cash.",
    ratios: [
      { label: "Debt / equity", value: "0.09x" },
      { label: "Net debt / EBITDA", value: "-1.4x" },
      { label: "Interest coverage", value: "62x", delta: "+14x", direction: "up" },
    ],
  },
  {
    title: "Efficiency",
    description: "How well assets and working capital are used.",
    ratios: [
      { label: "Asset turnover", value: "1.10x", series: [0.9, 1.0, 1.05, 1.1] },
      { label: "Inventory turnover", value: "8.2x", series: [6.9, 7.4, 7.9, 8.2] },
      { label: "Receivable days", value: "42", delta: "-3", direction: "up", series: [48, 46, 45, 42] },
    ],
  },
  {
    title: "Cash generation",
    description: "Quality of earnings as cash.",
    ratios: [
      { label: "FCF margin", value: "25.5%", delta: "+3.3pt", direction: "up", series: [13.8, 18.1, 22.2, 25.5] },
      { label: "Cash conversion", value: "92%", delta: "+4pt", direction: "up", series: [80, 85, 88, 92] },
    ],
  },
];
