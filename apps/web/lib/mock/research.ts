/**
 * MOCK research data — populates the Research workspace tables. Fictional and
 * illustrative; tied to the same sample universe as the rest of the app. No
 * sourced facts. Labelled as sample in every view.
 */

export interface NoteRow {
  id: string;
  title: string;
  company: string;
  theme: string;
  author: string;
  updated: string;
}
export interface ReportRow {
  id: string;
  title: string;
  company: string;
  version: string;
  status: string;
  date: string;
}
export interface EvidenceRow {
  id: string;
  claim: string;
  source: string;
  type: string;
  confidence: "Low" | "Medium" | "High";
  date: string;
}
export interface VersionRow {
  id: string;
  version: string;
  report: string;
  author: string;
  change: string;
  date: string;
}
export interface HypothesisRow {
  id: string;
  hypothesis: string;
  company: string;
  status: string;
  confidence: "Low" | "Medium" | "High";
  updated: string;
}
export interface DecisionRow {
  id: string;
  decision: string;
  context: string;
  conviction: string;
  outcome: string;
  date: string;
}

const AUTHOR = "A. Analyst";

export const NOTES: NoteRow[] = [
  { id: "n1", title: "Helios margin durability", company: "Helios Compute", theme: "Margins", author: AUTHOR, updated: "2025-02-20" },
  { id: "n2", title: "Power & cooling bottleneck", company: "AI Infrastructure", theme: "Supply chain", author: AUTHOR, updated: "2025-02-18" },
  { id: "n3", title: "Customer concentration check", company: "Helios Compute", theme: "Risk", author: AUTHOR, updated: "2025-02-15" },
  { id: "n4", title: "Foundry capacity read", company: "Foundry Co", theme: "Supply chain", author: AUTHOR, updated: "2025-02-11" },
  { id: "n5", title: "Rival accelerator pricing", company: "Rival Accel", theme: "Competition", author: AUTHOR, updated: "2025-02-08" },
];

export const REPORTS: ReportRow[] = [
  { id: "r1", title: "Helios — Company Intelligence", company: "Helios Compute", version: "v1.2", status: "In review", date: "2025-02-20" },
  { id: "r2", title: "Helios — Investment Research", company: "Helios Compute", version: "v1.2", status: "In review", date: "2025-02-20" },
  { id: "r3", title: "AI Infrastructure — Industry", company: "AI Infrastructure", version: "v1.0", status: "Draft", date: "2025-02-12" },
  { id: "r4", title: "Q1 Board Pack", company: "Portfolio", version: "v1.0", status: "Final", date: "2025-02-20" },
];

export const EVIDENCE: EvidenceRow[] = [
  { id: "e1", claim: "FY24 revenue up 68% YoY", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
  { id: "e2", claim: "Operating margin ~39%", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
  { id: "e3", claim: "Concentration increasing", source: "Earnings transcript", type: "Transcript", confidence: "Medium", date: "2025-02-19" },
  { id: "e4", claim: "Power constraints widening", source: "Industry note", type: "Research", confidence: "Medium", date: "2025-01-30" },
  { id: "e5", claim: "Alternate sources unqualified", source: "Channel check", type: "Primary", confidence: "Low", date: "2025-02-05" },
];

export const VERSIONS: VersionRow[] = [
  { id: "v1", version: "v1.2", report: "Helios — Company Intelligence", author: AUTHOR, change: "Refined recommendations after review.", date: "2025-02-20" },
  { id: "v2", version: "v1.1", report: "Helios — Company Intelligence", author: AUTHOR, change: "Added evidence and risk matrix.", date: "2025-02-12" },
  { id: "v3", version: "v1.0", report: "Helios — Company Intelligence", author: AUTHOR, change: "Initial draft.", date: "2025-02-05" },
];

export const HYPOTHESES: HypothesisRow[] = [
  { id: "h1", hypothesis: "Pricing power holds through FY25", company: "Helios Compute", status: "Open", confidence: "Medium", updated: "2025-02-20" },
  { id: "h2", hypothesis: "Margin expansion is structural", company: "Helios Compute", status: "Confirmed", confidence: "High", updated: "2025-02-18" },
  { id: "h3", hypothesis: "Concentration is a near-term risk", company: "Helios Compute", status: "Open", confidence: "Medium", updated: "2025-02-15" },
  { id: "h4", hypothesis: "Cooling layer captures more value", company: "AI Infrastructure", status: "Open", confidence: "Low", updated: "2025-02-10" },
];

export const DECISIONS: DecisionRow[] = [
  { id: "d1", decision: "Recommend raising conviction", context: "FY24 beat-and-raise", conviction: "High", outcome: "Awaiting committee", date: "2025-02-20" },
  { id: "d2", decision: "Open power/cooling coverage", context: "Value migrating downstream", conviction: "Medium", outcome: "Scheduled", date: "2025-02-20" },
  { id: "d3", decision: "Add concentration monitor", context: "Top-customer share rising", conviction: "Medium", outcome: "In place", date: "2025-02-12" },
];
