/**
 * EDGAR ingestion roster — US-GAAP filers in the Atlas coverage universe.
 *
 * `cik` is the SEC Central Index Key (zero-padded to 10 digits in URLs).
 * `fyEndMonth` anchors datapoint→fiscal-year attribution (see refresh.mjs):
 * a fiscal year's end date falls within ±1 month of this month, and the
 * label year equals the end date's calendar year (NVDA's FY ending
 * 2025-01-26 → FY25, matching the labels the manual seed used).
 */
export const EDGAR_COMPANIES = [
  { id: "nvidia", cik: 1045810, fyEndMonth: 1 },
  { id: "amd", cik: 2488, fyEndMonth: 12 },
  { id: "broadcom", cik: 1730168, fyEndMonth: 11 },
  { id: "micron", cik: 723125, fyEndMonth: 9 },
  { id: "intel", cik: 50863, fyEndMonth: 12 },
  { id: "arista", cik: 1596532, fyEndMonth: 12 },
  { id: "vertiv", cik: 1674101, fyEndMonth: 12 },
];

/** Atlas concept -> ordered US-GAAP tag candidates (first hit wins per year). */
export const TAG_MAP = {
  Revenue: [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
  ],
  CostOfRevenue: ["CostOfRevenue", "CostOfGoodsAndServicesSold"],
  RnDExpense: ["ResearchAndDevelopmentExpense"],
  SnMExpense: ["SellingAndMarketingExpense"],
  GnAExpense: [
    "GeneralAndAdministrativeExpense",
    "SellingGeneralAndAdministrativeExpense",
  ],
  OperatingIncome: ["OperatingIncomeLoss"],
  NetIncome: ["NetIncomeLoss"],
  IncomeTax: ["IncomeTaxExpenseBenefit"],
  InterestExpense: ["InterestExpense", "InterestExpenseNonoperating"],
  OperatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities"],
  Capex: ["PaymentsToAcquirePropertyPlantAndEquipment"],
  DepreciationAmortization: [
    "DepreciationDepletionAndAmortization",
    "DepreciationAmortizationAndAccretionNet",
  ],
  ShareRepurchases: ["PaymentsForRepurchaseOfCommonStock"],
  AcquisitionsInvestments: ["PaymentsToAcquireBusinessesNetOfCashAcquired"],
  CashAndEquivalents: ["CashAndCashEquivalentsAtCarryingValue"],
  AccountsReceivable: ["AccountsReceivableNetCurrent"],
  Inventory: ["InventoryNet"],
  PropertyEquipment: ["PropertyPlantAndEquipmentNet"],
  CurrentAssets: ["AssetsCurrent"],
  CurrentLiabilities: ["LiabilitiesCurrent"],
  TotalAssets: ["Assets"],
  TotalLiabilities: ["Liabilities"],
  TotalEquity: ["StockholdersEquity"],
  LongTermDebt: ["LongTermDebtNoncurrent", "LongTermDebt"],
  ShortTermDebt: ["LongTermDebtCurrent"],
  AccountsPayable: ["AccountsPayableCurrent"],
  DilutedShares: ["WeightedAverageNumberOfDilutedSharesOutstanding"],
};

/** Added onto CashAndEquivalents when present (cash parked in ST paper). */
export const CASH_ADDONS = ["ShortTermInvestments", "MarketableSecuritiesCurrent"];

/** Summed into GoodwillIntangibles. */
export const GOODWILL_PARTS = ["Goodwill", "IntangibleAssetsNetExcludingGoodwill"];

/** Concepts measured over a duration (need the 330–380 day annual filter). */
export const DURATION_CONCEPTS = new Set([
  "Revenue", "CostOfRevenue", "RnDExpense", "SnMExpense", "GnAExpense",
  "OperatingIncome", "NetIncome", "IncomeTax", "InterestExpense",
  "OperatingCashFlow", "Capex", "DepreciationAmortization",
  "ShareRepurchases", "AcquisitionsInvestments", "DilutedShares",
]);
