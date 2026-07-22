/**
 * MOCK Atlas Score data — P010 v1 UI scaffold. Score model is versioned in the
 * real design (score_model/score_factor/company_score); here a single active
 * mock version exercises the ranking table + factor breakdown UI.
 */
export interface FactorScore {
  code: "quality" | "growth" | "valuation" | "cycle" | "risk";
  label: string;
  score: number; // 0-100
}

export interface CompanyScore {
  ticker: string;
  name: string;
  sector: string;
  total: number;
  factors: FactorScore[];
}

const FACTOR_LABELS: FactorScore["code"][] = ["quality", "growth", "valuation", "cycle", "risk"];
const FACTOR_ZH: Record<FactorScore["code"], string> = {
  quality: "质量",
  growth: "成长",
  valuation: "估值",
  cycle: "周期位置",
  risk: "风险(反向)",
};

function mkFactors(seed: number): FactorScore[] {
  return FACTOR_LABELS.map((code, i) => ({
    code,
    label: FACTOR_ZH[code],
    score: Math.max(10, Math.min(96, Math.round(50 + Math.sin(seed * 1.7 + i * 2.1) * 40))),
  }));
}

export const SCORE_MODEL_VERSION = "v1.3 (2026-07-01)";

export const COMPANY_SCORES: CompanyScore[] = [
  { ticker: "HLXC", name: "Helios Compute Corp", sector: "AI Accelerators & GPUs", total: 0, factors: mkFactors(3) },
  { ticker: "ARFY", name: "Aurora Foundry", sector: "Foundry & IDM", total: 0, factors: mkFactors(7) },
  { ticker: "VTXM", name: "Vertex Memory", sector: "Memory", total: 0, factors: mkFactors(11) },
  { ticker: "NMBS", name: "Nimbus Networks", sector: "Networking & Custom ASIC", total: 0, factors: mkFactors(2) },
  { ticker: "SLPW", name: "Solstice Power & Cooling", sector: "DC Power & Cooling", total: 0, factors: mkFactors(5) },
  { ticker: "MRGV", name: "Meridian Glove Bhd", sector: "Rubber & Medical Gloves", total: 0, factors: mkFactors(9) },
].map((c) => ({ ...c, total: Math.round(c.factors.reduce((a, f) => a + f.score, 0) / c.factors.length) }));
