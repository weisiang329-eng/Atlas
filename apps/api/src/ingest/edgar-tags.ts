/**
 * EDGAR roster and the US-GAAP tag map.
 *
 * Moved out of seed/edgar/companies.mjs so the Worker's ingest route and the
 * offline seed generator share ONE definition. Two copies of a tag-priority
 * list is two chances for the API and the seeded database to disagree about
 * what "Revenue" means for a company.
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

/**
 * Duration concepts that are NOT additive across quarters.
 *
 * `DilutedShares` is a weighted-AVERAGE share count. It behaves like a
 * duration figure for annual attribution, but Q4 = FY − 9M is arithmetic
 * nonsense for an average: NVIDIA FY26 came out as −28 million shares, which
 * turned Q4 EPS into −1,534.29 on a $42.9bn profit.
 *
 * So these are taken only where the filer reports the discrete quarter, and
 * are otherwise absent. A missing share count costs one EPS cell; a
 * differenced one silently poisons every per-share figure downstream.
 */
export const NON_ADDITIVE_CONCEPTS = new Set(["DilutedShares", "BasicShares"]);
