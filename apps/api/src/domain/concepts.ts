/**
 * Canonical financial concept catalog + statement presentation specs.
 *
 * Facts are stored as `concept -> value` (positive magnitudes, in the period's
 * unit). This module is the single source of truth for:
 *   1. the set of valid concept keys (`CONCEPTS`), and
 *   2. how those facts render into the income / balance-sheet / cash-flow
 *      presentations the frontend's `StatementRow[]` contract expects.
 *
 * Presentation sign is applied here, not in storage: expenses are stored as
 * positive magnitudes and shown negative via `sign: -1`, matching how the UI
 * (and reported statements) display them. Totals that are not stored directly
 * are derived via `compute`.
 */

/** A period's facts, keyed by concept. Missing concepts are `undefined`. */
export type FactMap = Record<string, number | undefined>;

/** Canonical concept keys. Extend as ingestion coverage grows. */
export const CONCEPTS = {
  // Income statement
  Revenue: "Revenue",
  ProductRevenue: "ProductRevenue",
  ServiceRevenue: "ServiceRevenue",
  CostOfRevenue: "CostOfRevenue",
  RnDExpense: "RnDExpense",
  SnMExpense: "SnMExpense",
  GnAExpense: "GnAExpense",
  OperatingIncome: "OperatingIncome",
  InterestOtherNet: "InterestOtherNet",
  InterestExpense: "InterestExpense",
  IncomeTax: "IncomeTax",
  NetIncome: "NetIncome",
  DilutedShares: "DilutedShares",
  // Balance sheet
  CashAndEquivalents: "CashAndEquivalents",
  AccountsReceivable: "AccountsReceivable",
  Inventory: "Inventory",
  PropertyEquipment: "PropertyEquipment",
  GoodwillIntangibles: "GoodwillIntangibles",
  CurrentAssets: "CurrentAssets",
  TotalAssets: "TotalAssets",
  AccountsPayable: "AccountsPayable",
  LongTermDebt: "LongTermDebt",
  ShortTermDebt: "ShortTermDebt",
  CurrentLiabilities: "CurrentLiabilities",
  OtherLiabilities: "OtherLiabilities",
  TotalLiabilities: "TotalLiabilities",
  TotalEquity: "TotalEquity",
  // Cash flow
  DepreciationAmortization: "DepreciationAmortization",
  ChangeWorkingCapital: "ChangeWorkingCapital",
  OperatingCashFlow: "OperatingCashFlow",
  Capex: "Capex",
  AcquisitionsInvestments: "AcquisitionsInvestments",
  ShareRepurchases: "ShareRepurchases",
  DebtIssuedRepaid: "DebtIssuedRepaid",
} as const;

export type ConceptKey = (typeof CONCEPTS)[keyof typeof CONCEPTS];

export const ALL_CONCEPTS: ConceptKey[] = Object.values(CONCEPTS);

const num = (v: number | undefined): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** Sum of defined addends; `undefined` if every addend is missing. */
function sum(...xs: (number | undefined)[]): number | undefined {
  const defined = xs.filter((x): x is number => typeof x === "number");
  return defined.length === 0 ? undefined : defined.reduce((a, b) => a + b, 0);
}

/**
 * A single row in a rendered statement. `concept` pulls a stored fact;
 * `compute` derives a value; a bare row (neither) is a section header.
 */
export interface RowSpec {
  label: string;
  indent?: boolean;
  kind?: "section" | "total";
  concept?: ConceptKey;
  compute?: (f: FactMap) => number | undefined;
  /** Presentation sign for a `concept` row (expenses use -1). Default +1. */
  sign?: -1 | 1;
}

export const INCOME_STATEMENT_SPEC: RowSpec[] = [
  { label: "Revenue", kind: "section" },
  { label: "Product", indent: true, concept: CONCEPTS.ProductRevenue },
  { label: "Services", indent: true, concept: CONCEPTS.ServiceRevenue },
  { label: "Total revenue", kind: "total", concept: CONCEPTS.Revenue },
  { label: "Costs & expenses", kind: "section" },
  { label: "Cost of revenue", indent: true, concept: CONCEPTS.CostOfRevenue, sign: -1 },
  { label: "Research & development", indent: true, concept: CONCEPTS.RnDExpense, sign: -1 },
  { label: "Sales & marketing", indent: true, concept: CONCEPTS.SnMExpense, sign: -1 },
  { label: "General & administrative", indent: true, concept: CONCEPTS.GnAExpense, sign: -1 },
  {
    label: "Total costs & expenses",
    kind: "total",
    compute: (f) => {
      const s = sum(f.CostOfRevenue, f.RnDExpense, f.SnMExpense, f.GnAExpense);
      return s === undefined ? undefined : -s;
    },
  },
  { label: "Operating income", kind: "total", concept: CONCEPTS.OperatingIncome },
  { label: "Interest & other, net", concept: CONCEPTS.InterestOtherNet },
  { label: "Income tax", concept: CONCEPTS.IncomeTax, sign: -1 },
  { label: "Net income", kind: "total", concept: CONCEPTS.NetIncome },
];

export const BALANCE_SHEET_SPEC: RowSpec[] = [
  { label: "Assets", kind: "section" },
  { label: "Cash & equivalents", indent: true, concept: CONCEPTS.CashAndEquivalents },
  { label: "Accounts receivable", indent: true, concept: CONCEPTS.AccountsReceivable },
  { label: "Inventory", indent: true, concept: CONCEPTS.Inventory },
  { label: "Property & equipment", indent: true, concept: CONCEPTS.PropertyEquipment },
  { label: "Goodwill & intangibles", indent: true, concept: CONCEPTS.GoodwillIntangibles },
  { label: "Total assets", kind: "total", concept: CONCEPTS.TotalAssets },
  { label: "Liabilities", kind: "section" },
  { label: "Accounts payable", indent: true, concept: CONCEPTS.AccountsPayable },
  { label: "Long-term debt", indent: true, concept: CONCEPTS.LongTermDebt },
  { label: "Other liabilities", indent: true, concept: CONCEPTS.OtherLiabilities },
  { label: "Total liabilities", kind: "total", concept: CONCEPTS.TotalLiabilities },
  { label: "Equity", kind: "section" },
  { label: "Total equity", kind: "total", concept: CONCEPTS.TotalEquity },
];

export const CASHFLOW_SPEC: RowSpec[] = [
  { label: "Operating", kind: "section" },
  { label: "Net income", indent: true, concept: CONCEPTS.NetIncome },
  { label: "Depreciation & amortization", indent: true, concept: CONCEPTS.DepreciationAmortization },
  { label: "Change in working capital", indent: true, concept: CONCEPTS.ChangeWorkingCapital },
  { label: "Cash from operations", kind: "total", concept: CONCEPTS.OperatingCashFlow },
  { label: "Investing", kind: "section" },
  { label: "Capital expenditure", indent: true, concept: CONCEPTS.Capex, sign: -1 },
  { label: "Acquisitions & investments", indent: true, concept: CONCEPTS.AcquisitionsInvestments, sign: -1 },
  {
    label: "Cash from investing",
    kind: "total",
    compute: (f) => {
      const s = sum(f.Capex, f.AcquisitionsInvestments);
      return s === undefined ? undefined : -s;
    },
  },
  { label: "Financing", kind: "section" },
  { label: "Share repurchases", indent: true, concept: CONCEPTS.ShareRepurchases, sign: -1 },
  { label: "Debt issued / (repaid)", indent: true, concept: CONCEPTS.DebtIssuedRepaid },
  {
    label: "Cash from financing",
    kind: "total",
    compute: (f) => {
      const repurch = num(f.ShareRepurchases);
      const debt = num(f.DebtIssuedRepaid);
      if (repurch === undefined && debt === undefined) return undefined;
      return (debt ?? 0) - (repurch ?? 0);
    },
  },
  {
    label: "Net change in cash",
    kind: "total",
    compute: (f) => {
      const ocf = num(f.OperatingCashFlow);
      const cfi =
        f.Capex === undefined && f.AcquisitionsInvestments === undefined
          ? undefined
          : -((num(f.Capex) ?? 0) + (num(f.AcquisitionsInvestments) ?? 0));
      const cff =
        f.ShareRepurchases === undefined && f.DebtIssuedRepaid === undefined
          ? undefined
          : (num(f.DebtIssuedRepaid) ?? 0) - (num(f.ShareRepurchases) ?? 0);
      return sum(ocf, cfi, cff);
    },
  },
];
