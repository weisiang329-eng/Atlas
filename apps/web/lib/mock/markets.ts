/**
 * MOCK markets data — P027 v1 UI scaffold.
 *
 * Real tickers (NVDA, TSMC, …) already exist as `company` entities from EDGAR
 * ingestion (P003/P005) — but no quote-feed provider is wired yet. To avoid
 * displaying fabricated prices under real tickers, this mock follows the same
 * convention as `lib/mock/financials.ts` (Helios Compute Corp): a small set of
 * FICTIONAL, clearly-labelled sample tickers exercises the table/chart/flash
 * architecture. Replace wholesale when the P027 quote-feed adapter lands —
 * nothing here is a real quote.
 */
import type { Candle } from "@/components/chart/candlestick";
import type { IntradayPoint } from "@/components/chart/intraday-chart";

export interface MockQuote {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  prevClose: number;
  currency: "USD" | "MYR";
  delaySec: number;
}

export const MOCK_SUBJECT_NOTE =
  "Mock quotes — fictional entities, no live provider connected yet.";

export const INDEX_KPIS = [
  { label: "S&P 500 (mock)", value: "5,764.30", delta: "+0.42%", direction: "up" as const },
  { label: "Nasdaq 100 (mock)", value: "20,340.10", delta: "+0.78%", direction: "up" as const },
  { label: "Philadelphia SOX (mock)", value: "5,120.40", delta: "-0.34%", direction: "down" as const },
  { label: "DXY (mock)", value: "98.42", delta: "-0.21%", direction: "down" as const },
];

export const MOCK_QUOTES: MockQuote[] = [
  { ticker: "HLXC", name: "Helios Compute Corp", sector: "AI Accelerators & GPUs", price: 172.4, prevClose: 169.35, currency: "USD", delaySec: 0 },
  { ticker: "ARFY", name: "Aurora Foundry", sector: "Foundry & IDM", price: 184.6, prevClose: 183.0, currency: "USD", delaySec: 0 },
  { ticker: "VTXM", name: "Vertex Memory", sector: "Memory", price: 118.3, prevClose: 121.0, currency: "USD", delaySec: 0 },
  { ticker: "NMBS", name: "Nimbus Networks", sector: "Networking & Custom ASIC", price: 242.1, prevClose: 236.6, currency: "USD", delaySec: 0 },
  { ticker: "SLPW", name: "Solstice Power & Cooling", sector: "DC Power & Cooling", price: 89.25, prevClose: 89.85, currency: "USD", delaySec: 0 },
  { ticker: "MRGV", name: "Meridian Glove Bhd", sector: "Rubber & Medical Gloves", price: 2.14, prevClose: 2.11, currency: "MYR", delaySec: 900 },
];

/** Deterministic pseudo-series generator — sample data only, not a market model. */
function series(n: number, start: number, drift: number, vol: number, seed: number): number[] {
  let v = start;
  let s = seed || 7;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = v * (1 + drift + r * vol);
    out.push(v);
  }
  return out;
}

export function mockSparkline(ticker: string, up: boolean): number[] {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return series(18, 100, up ? 0.006 : -0.004, 0.05, seed);
}

export function mockIntraday(prevClose: number, seed: number): IntradayPoint[] {
  const vals = series(48, prevClose, 0.0006, 0.01, seed);
  return vals.map((v, i) => {
    const h = 9 + Math.floor(i / 6);
    const m = (i % 6) * 10;
    return { label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, value: v };
  });
}

export function mockCandles(start: number, seed: number, n = 60): Candle[] {
  let c = start;
  let s = seed || 3;
  const out: Candle[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    const o = c;
    c = o * (1 + 0.002 + r * 0.05);
    const d = new Date(today);
    d.setDate(d.getDate() - (n - i));
    out.push({
      label: d.toISOString().slice(5, 10),
      o,
      h: Math.max(o, c) * (1 + Math.abs(r) * 0.02),
      l: Math.min(o, c) * (1 - Math.abs(r) * 0.02),
      c,
      v: 1e6 * (1 + Math.abs(r) * 8),
    });
  }
  return out;
}
