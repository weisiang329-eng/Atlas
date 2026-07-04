/**
 * MOCK Atlas reports — ATLAS-UI-P002.
 *
 * Every report is illustrative sample content for a FICTIONAL subject. No real
 * companies, no sourced facts, no AI generation — this exists purely to shape
 * the report UI. All views label the data as mock. Replace wholesale when a
 * report/AI backend contract lands.
 */

export type Impact = "positive" | "negative" | "watch" | "neutral";
export type Level = "Low" | "Medium" | "High";
export type ReportStatus = "Draft" | "In review" | "Final";

export interface DecisionLens {
  changed: string;
  why: string;
  affected: string;
  evidence: string;
  next: string;
}
export interface Finding {
  title: string;
  detail: string;
  impact: Impact;
}
export interface EvidenceItem {
  claim: string;
  source: string;
  type: string;
  confidence: Level;
  date: string;
}
export interface Source {
  title: string;
  publisher: string;
  type: string;
  date: string;
}
export interface Risk {
  title: string;
  likelihood: Level;
  impact: Level;
  note: string;
}
export interface Opportunity {
  title: string;
  detail: string;
}
export interface Recommendation {
  action: string;
  rationale: string;
  priority: Level;
  owner: string;
}
export interface DecisionEntry {
  date: string;
  decision: string;
  owner: string;
  outcome: string;
}
export interface AppendixItem {
  title: string;
  note: string;
}
export interface VersionEntry {
  version: string;
  date: string;
  author: string;
  change: string;
}

export interface ReportModel {
  id: string;
  type: string;
  title: string;
  subject: string;
  author: string;
  date: string;
  version: string;
  status: ReportStatus;
  confidence: Level;
  summary: string;
  lens: DecisionLens;
  keyFindings: Finding[];
  evidence: EvidenceItem[];
  sources: Source[];
  risks: Risk[];
  opportunities: Opportunity[];
  assumptions: string[];
  openQuestions: string[];
  recommendations: Recommendation[];
  decisionLog: DecisionEntry[];
  appendix: AppendixItem[];
  versionHistory: VersionEntry[];
}

// Shared filler — realistic but generic; distinctive fields are set per report.
const AUTHOR = "A. Analyst (sample)";
const VERSIONS: VersionEntry[] = [
  { version: "v1.2", date: "2025-02-20", author: AUTHOR, change: "Refined recommendations after review." },
  { version: "v1.1", date: "2025-02-12", author: AUTHOR, change: "Added evidence and risk matrix." },
  { version: "v1.0", date: "2025-02-05", author: AUTHOR, change: "Initial draft." },
];
const APPENDIX: AppendixItem[] = [
  { title: "Methodology", note: "Sample methodology note — how findings would be assembled and scored." },
  { title: "Glossary", note: "Definitions of terms used throughout the report." },
];
const SOURCES: Source[] = [
  { title: "Company filing (FY24)", publisher: "Sample filing", type: "Filing", date: "2025-02-18" },
  { title: "Earnings call transcript", publisher: "Investor relations", type: "Transcript", date: "2025-02-19" },
  { title: "Industry note", publisher: "Sample research", type: "Research", date: "2025-01-30" },
];

type ReportInput = Omit<
  ReportModel,
  "author" | "date" | "version" | "status" | "confidence" | "versionHistory" | "appendix" | "sources"
> &
  Partial<Pick<ReportModel, "status" | "confidence" | "sources" | "appendix">>;

function mk(input: ReportInput): ReportModel {
  return {
    author: AUTHOR,
    date: "2025-02-20",
    version: "v1.2",
    status: input.status ?? "In review",
    confidence: input.confidence ?? "Medium",
    sources: input.sources ?? SOURCES,
    appendix: input.appendix ?? APPENDIX,
    versionHistory: VERSIONS,
    ...input,
  };
}

const REPORTS: ReportModel[] = [
  mk({
    id: "company-intelligence",
    type: "Company Intelligence Report",
    title: "Helios Compute Corp — Company Intelligence",
    subject: "Helios Compute Corp (HLXC)",
    confidence: "High",
    summary:
      "Helios continues to compound revenue on AI-infrastructure demand while margins expand. The investment case strengthens, but customer concentration and supply dependence remain the decisive risks to monitor.",
    lens: {
      changed: "FY24 revenue grew 68% with operating margin up ~4pts.",
      why: "Demand for AI compute plus a richer product mix.",
      affected: "Suppliers, hyperscaler customers, and competing accelerators.",
      evidence: "FY24 filing, earnings transcript, channel checks.",
      next: "Decide whether to raise conviction ahead of the next print.",
    },
    keyFindings: [
      { title: "Revenue growth re-accelerated", detail: "FY24 revenue reached 21,000 (USD m), up 68% YoY, led by the product segment.", impact: "positive" },
      { title: "Margin expansion held", detail: "Operating margin rose to ~39%, evidence of pricing power and scale.", impact: "positive" },
      { title: "Customer concentration rising", detail: "Top customers represent a growing share of revenue — a fragility to watch.", impact: "watch" },
    ],
    evidence: [
      { claim: "FY24 revenue up 68% YoY", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
      { claim: "Operating margin ~39%", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
      { claim: "Concentration increasing", source: "Earnings transcript", type: "Transcript", confidence: "Medium", date: "2025-02-19" },
    ],
    risks: [
      { title: "Customer concentration", likelihood: "Medium", impact: "High", note: "A few large customers drive most growth." },
      { title: "Supply dependence", likelihood: "Medium", impact: "High", note: "Reliance on a small set of upstream suppliers." },
      { title: "Competitive pricing", likelihood: "Low", impact: "Medium", note: "New accelerators could pressure pricing." },
    ],
    opportunities: [
      { title: "Software attach", detail: "Higher-margin software could lift blended margins further." },
      { title: "New verticals", detail: "Expansion beyond core hyperscalers into enterprise." },
    ],
    assumptions: [
      "AI-infrastructure demand stays strong through the next fiscal year.",
      "No major supply disruption in the upstream chain.",
    ],
    openQuestions: [
      "How durable is the current pricing power?",
      "What is the real customer concentration net of resellers?",
    ],
    recommendations: [
      { action: "Raise conviction one notch", rationale: "Growth and margins both improving with evidence.", priority: "High", owner: "Research lead" },
      { action: "Add concentration monitor", rationale: "Track top-customer share each quarter.", priority: "Medium", owner: "Analyst" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Hold rating, monitor concentration", owner: "Research lead", outcome: "Pending next print" },
      { date: "2024-08-01", decision: "Raised to Overweight", owner: "Research lead", outcome: "Played out" },
    ],
  }),
  mk({
    id: "industry-intelligence",
    type: "Industry Intelligence Report",
    title: "AI Infrastructure — Industry Intelligence",
    subject: "AI infrastructure value chain",
    summary:
      "The AI-infrastructure stack is expanding from silicon to power and cooling. Bottlenecks are shifting downstream toward data-center power, reshaping which layers capture value.",
    lens: {
      changed: "The binding constraint moved from GPUs toward power and cooling.",
      why: "Capacity additions outpaced grid and thermal readiness.",
      affected: "Power, cooling, and transformer suppliers gain leverage.",
      evidence: "Capex disclosures and industry notes.",
      next: "Decide where to add coverage across the value chain.",
    },
    keyFindings: [
      { title: "Bottleneck shifted downstream", detail: "Power and cooling now gate deployment more than raw compute.", impact: "watch" },
      { title: "Value migrating to enablers", detail: "Power/thermal suppliers gaining pricing leverage.", impact: "positive" },
      { title: "Supply still concentrated", detail: "Key layers remain dependent on a few vendors.", impact: "negative" },
    ],
    evidence: [
      { claim: "Power constraints cited widely", source: "Industry note", type: "Research", confidence: "Medium", date: "2025-01-30" },
      { claim: "Capex mix shifting to infrastructure", source: "Company filing (FY24)", type: "Filing", confidence: "Medium", date: "2025-02-18" },
    ],
    risks: [
      { title: "Grid capacity limits", likelihood: "High", impact: "High", note: "Power availability constrains buildout." },
      { title: "Vendor concentration", likelihood: "Medium", impact: "High", note: "Few suppliers in critical layers." },
    ],
    opportunities: [
      { title: "Cooling & power names", detail: "Under-covered layer capturing rising value." },
    ],
    assumptions: ["AI capex growth continues near current pace."],
    openQuestions: ["Which layer holds pricing power longest?"],
    recommendations: [
      { action: "Add power & cooling coverage", rationale: "Value is migrating to these layers.", priority: "High", owner: "Industry lead" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Open coverage on power/cooling", owner: "Industry lead", outcome: "Pending" },
    ],
  }),
  mk({
    id: "investment-research",
    type: "Investment Research Report",
    title: "Helios Compute Corp — Investment Research",
    subject: "Helios Compute Corp (HLXC)",
    confidence: "High",
    summary:
      "We see an asymmetric setup: durable growth with expanding margins against well-understood concentration risk. The thesis rests on continued AI-infrastructure demand and pricing power holding.",
    lens: {
      changed: "Estimates moved higher after FY24 results.",
      why: "Beat on revenue and margin, guidance raised.",
      affected: "The rating and target under review.",
      evidence: "FY24 results, transcript, model update.",
      next: "Decide rating and position sizing.",
    },
    keyFindings: [
      { title: "Thesis intact and strengthening", detail: "Growth durability improved with margin evidence.", impact: "positive" },
      { title: "Valuation demands growth", detail: "Multiple prices in continued execution — limited room for a miss.", impact: "watch" },
      { title: "Downside is concentration-driven", detail: "A key-customer loss is the main bear case.", impact: "negative" },
    ],
    evidence: [
      { claim: "Guidance raised", source: "Earnings transcript", type: "Transcript", confidence: "High", date: "2025-02-19" },
      { claim: "Margin trajectory positive", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
    ],
    risks: [
      { title: "Multiple compression", likelihood: "Medium", impact: "High", note: "Any growth wobble re-rates the stock." },
      { title: "Key-customer loss", likelihood: "Low", impact: "High", note: "Concentration is the core bear case." },
    ],
    opportunities: [
      { title: "Estimate upside", detail: "Software/mix could drive above-consensus margins." },
    ],
    assumptions: ["Demand and pricing power persist through the year."],
    openQuestions: ["What is the right position size given concentration?"],
    recommendations: [
      { action: "Maintain Overweight", rationale: "Risk/reward remains favourable.", priority: "High", owner: "PM" },
      { action: "Size below max", rationale: "Concentration warrants a smaller position.", priority: "Medium", owner: "PM" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Maintain Overweight, size 3%", owner: "PM", outcome: "Pending" },
    ],
  }),
  mk({
    id: "financial-analysis",
    type: "Financial Analysis Report",
    title: "Helios Compute Corp — Financial Analysis",
    subject: "Helios Compute Corp (HLXC)",
    summary:
      "Quality of earnings looks healthy: growth is cash-generative, margins are expanding, and the balance sheet is under-levered. Working-capital swings are the main thing to watch.",
    lens: {
      changed: "Free cash flow scaled with earnings in FY24.",
      why: "Operating leverage and disciplined capex.",
      affected: "Coverage of liquidity and capital-return options.",
      evidence: "Cash-flow statement and balance sheet.",
      next: "Decide whether balance-sheet capacity changes the thesis.",
    },
    keyFindings: [
      { title: "Cash conversion strong", detail: "FCF scaled with net income; low accrual reliance.", impact: "positive" },
      { title: "Under-levered balance sheet", detail: "Ample capacity for buybacks or investment.", impact: "positive" },
      { title: "Working-capital volatility", detail: "Receivables/inventory swings can distort quarters.", impact: "watch" },
    ],
    evidence: [
      { claim: "FCF ~5,350 (USD m)", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
      { claim: "Low net leverage", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
    ],
    risks: [
      { title: "WC-driven misses", likelihood: "Medium", impact: "Medium", note: "Timing can distort a print." },
      { title: "Capex step-up", likelihood: "Low", impact: "Medium", note: "Faster buildout could pressure FCF." },
    ],
    opportunities: [
      { title: "Capital return", detail: "Balance-sheet capacity supports buybacks." },
    ],
    assumptions: ["No large one-off charges in the period."],
    openQuestions: ["Is the WC swing structural or timing?"],
    recommendations: [
      { action: "Flag WC in the model", rationale: "Normalize quarters for WC noise.", priority: "Medium", owner: "Analyst" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "No change to quality-of-earnings view", owner: "Analyst", outcome: "Confirmed" },
    ],
  }),
  mk({
    id: "supply-chain",
    type: "Supply Chain Report",
    title: "Helios Compute Corp — Supply Chain",
    subject: "Helios supply network",
    summary:
      "The supply network is efficient but concentrated. A small number of upstream suppliers underpin most output, and downstream demand is similarly concentrated — resilience is the open question.",
    lens: {
      changed: "Lead times normalized but single-source exposure persists.",
      why: "Capacity recovered while qualification of alternates lagged.",
      affected: "Production continuity and gross margin.",
      evidence: "Supplier disclosures and channel checks.",
      next: "Decide whether resilience warrants a thesis adjustment.",
    },
    keyFindings: [
      { title: "Single-source exposure", detail: "Critical inputs depend on one or two suppliers.", impact: "negative" },
      { title: "Lead times normalized", detail: "Availability improved versus prior year.", impact: "positive" },
      { title: "Limited alternate qualification", detail: "Second sources not yet fully qualified.", impact: "watch" },
    ],
    evidence: [
      { claim: "Concentrated upstream", source: "Industry note", type: "Research", confidence: "Medium", date: "2025-01-30" },
    ],
    risks: [
      { title: "Single-source disruption", likelihood: "Medium", impact: "High", note: "One outage could halt output." },
      { title: "Logistics shocks", likelihood: "Low", impact: "Medium", note: "Freight/geopolitics could add friction." },
    ],
    opportunities: [
      { title: "Dual-sourcing", detail: "Qualifying alternates would de-risk supply." },
    ],
    assumptions: ["No major geopolitical disruption to logistics."],
    openQuestions: ["How fast can alternates be qualified?"],
    recommendations: [
      { action: "Track supplier concentration", rationale: "Resilience is the key uncertainty.", priority: "High", owner: "Supply analyst" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Add supply-resilience monitor", owner: "Supply analyst", outcome: "Pending" },
    ],
  }),
  mk({
    id: "ma-target",
    type: "M&A Target Report",
    title: "Project Aurora — M&A Target Screen",
    subject: "Aurora Cooling (sample target)",
    status: "Draft",
    confidence: "Low",
    summary:
      "Aurora is a plausible bolt-on in data-center cooling. Strategic fit is strong; the open questions are price, integration risk, and whether the synergy case survives diligence.",
    lens: {
      changed: "Target entered the screen after the cooling bottleneck thesis.",
      why: "Value is migrating toward thermal management.",
      affected: "Acquirer's roadmap and margin profile.",
      evidence: "Preliminary screen — not diligenced.",
      next: "Decide whether to proceed to formal diligence.",
    },
    keyFindings: [
      { title: "Strong strategic fit", detail: "Fills the thermal gap in the roadmap.", impact: "positive" },
      { title: "Integration risk unknown", detail: "Culture and systems not yet assessed.", impact: "watch" },
      { title: "Price likely full", detail: "Scarcity of assets could inflate valuation.", impact: "negative" },
    ],
    evidence: [
      { claim: "Cooling demand rising", source: "Industry note", type: "Research", confidence: "Medium", date: "2025-01-30" },
    ],
    risks: [
      { title: "Overpayment", likelihood: "Medium", impact: "High", note: "Competitive process may inflate price." },
      { title: "Integration failure", likelihood: "Medium", impact: "High", note: "Synergies may not materialize." },
    ],
    opportunities: [
      { title: "Vertical integration", detail: "Owning thermal could protect margins." },
    ],
    assumptions: ["Target is willing to engage."],
    openQuestions: ["Does the synergy case survive diligence?", "What price walks away?"],
    recommendations: [
      { action: "Proceed to diligence", rationale: "Strategic fit justifies a closer look.", priority: "Medium", owner: "Corp dev" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Advance to diligence gate", owner: "Corp dev", outcome: "Pending approval" },
    ],
  }),
  mk({
    id: "board-pack",
    type: "Board Pack",
    title: "Q1 Board Pack — Intelligence Summary",
    subject: "Portfolio & market overview",
    status: "Final",
    confidence: "High",
    summary:
      "The quarter's decisions centered on AI-infrastructure exposure. The portfolio benefited from the compute cycle; the board's attention should focus on concentration and supply resilience across holdings.",
    lens: {
      changed: "Compute-cycle exposure drove performance this quarter.",
      why: "Demand strength across AI-infrastructure names.",
      affected: "Portfolio construction and risk posture.",
      evidence: "Holdings review and market notes.",
      next: "Decide risk posture for next quarter.",
    },
    keyFindings: [
      { title: "Compute exposure paid off", detail: "AI-infrastructure holdings led returns.", impact: "positive" },
      { title: "Concentration building", detail: "Exposure is clustering in a few themes.", impact: "watch" },
      { title: "Supply resilience unclear", detail: "Cross-holding supply dependence needs review.", impact: "negative" },
    ],
    evidence: [
      { claim: "Sector led performance", source: "Industry note", type: "Research", confidence: "Medium", date: "2025-01-30" },
    ],
    risks: [
      { title: "Theme concentration", likelihood: "Medium", impact: "High", note: "Diversification is thinning." },
      { title: "Correlated supply risk", likelihood: "Medium", impact: "Medium", note: "Holdings share suppliers." },
    ],
    opportunities: [
      { title: "Rebalance", detail: "Trim winners, add under-covered layers." },
    ],
    assumptions: ["No regime change in rates or demand this quarter."],
    openQuestions: ["What concentration limit is acceptable?"],
    recommendations: [
      { action: "Set a theme-concentration limit", rationale: "Protect against clustered drawdowns.", priority: "High", owner: "Board" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Adopt concentration guardrail", owner: "Board", outcome: "Approved" },
    ],
  }),
  mk({
    id: "weekly-brief",
    type: "Weekly Intelligence Brief",
    title: "Weekly Intelligence Brief — Week 08",
    subject: "AI infrastructure watchlist",
    status: "Final",
    summary:
      "This week: strong FY24 prints across compute names, a growing power-and-cooling narrative, and rising attention to customer concentration. Net: the cycle is intact but the risks are becoming better defined.",
    lens: {
      changed: "Results confirmed the demand narrative.",
      why: "Multiple beats and raised guidance.",
      affected: "Watchlist priorities for next week.",
      evidence: "Filings and transcripts this week.",
      next: "Decide which names to deep-dive.",
    },
    keyFindings: [
      { title: "Broad-based beats", detail: "Compute names beat and raised.", impact: "positive" },
      { title: "Power/cooling in focus", detail: "Downstream bottleneck narrative building.", impact: "watch" },
      { title: "Concentration chatter", detail: "More questions on customer concentration.", impact: "negative" },
    ],
    evidence: [
      { claim: "Multiple guidance raises", source: "Earnings transcript", type: "Transcript", confidence: "Medium", date: "2025-02-19" },
    ],
    risks: [
      { title: "Crowded positioning", likelihood: "Medium", impact: "Medium", note: "Consensus is one-sided." },
    ],
    opportunities: [
      { title: "Deep-dive candidates", detail: "Power/cooling names for next week." },
    ],
    assumptions: ["No macro shock in the coming week."],
    openQuestions: ["Which name has the best risk/reward now?"],
    recommendations: [
      { action: "Schedule two deep-dives", rationale: "Follow the value migration.", priority: "Medium", owner: "Research" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Queue power/cooling deep-dives", owner: "Research", outcome: "Scheduled" },
    ],
  }),
  mk({
    id: "decision-memo",
    type: "Decision Memo",
    title: "Decision Memo — Raise Helios Conviction",
    subject: "Helios Compute Corp (HLXC)",
    confidence: "High",
    summary:
      "Recommendation: raise conviction on Helios one notch. The FY24 evidence supports durable growth and margin expansion; the concentration risk is real but monitorable. This memo records the decision and its rationale.",
    lens: {
      changed: "FY24 results improved the evidence base.",
      why: "Beat-and-raise with margin proof.",
      affected: "Rating, sizing, and monitoring plan.",
      evidence: "FY24 results and model update.",
      next: "Approve or reject the conviction change.",
    },
    keyFindings: [
      { title: "Evidence supports higher conviction", detail: "Growth durability and margins both improved.", impact: "positive" },
      { title: "Risk is monitorable", detail: "Concentration can be tracked quarterly.", impact: "watch" },
    ],
    evidence: [
      { claim: "Beat and raise", source: "Earnings transcript", type: "Transcript", confidence: "High", date: "2025-02-19" },
      { claim: "Margin expansion", source: "Company filing (FY24)", type: "Filing", confidence: "High", date: "2025-02-18" },
    ],
    risks: [
      { title: "Concentration", likelihood: "Medium", impact: "High", note: "Primary reason to size below max." },
    ],
    opportunities: [
      { title: "Estimate upside", detail: "Mix could push margins higher still." },
    ],
    assumptions: ["Demand and pricing power persist near-term."],
    openQuestions: ["What monitoring cadence is sufficient?"],
    recommendations: [
      { action: "Approve conviction raise (one notch)", rationale: "Evidence is sufficient; risk is monitorable.", priority: "High", owner: "Investment committee" },
      { action: "Set quarterly concentration review", rationale: "Bound the main risk.", priority: "Medium", owner: "Analyst" },
    ],
    decisionLog: [
      { date: "2025-02-20", decision: "Recommend raising conviction", owner: "Research lead", outcome: "Awaiting committee" },
      { date: "2025-02-19", decision: "Model updated post-results", owner: "Analyst", outcome: "Complete" },
    ],
  }),
];

export interface ReportTypeMeta {
  id: string;
  type: string;
  subject: string;
  status: ReportStatus;
  summaryLine: string;
}

export const REPORT_INDEX: ReportTypeMeta[] = REPORTS.map((r) => ({
  id: r.id,
  type: r.type,
  subject: r.subject,
  status: r.status,
  summaryLine: r.summary,
}));

export function getMockReport(id: string): ReportModel | undefined {
  return REPORTS.find((r) => r.id === id);
}

export const REPORT_IDS = REPORTS.map((r) => r.id);
