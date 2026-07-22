/**
 * Atlas Invest seed data — the initial coverage universe.
 *
 * PROVENANCE: figures are approximate annual values compiled manually from
 * public filings (10-K / 20-F / annual reports) as known to the seeding
 * assistant; they are close to reported GAAP/IFRS figures but NOT audited
 * copies, and some concepts are intentionally omitted where confidence was
 * low. Every seeded row links to a `source` row with kind='seed' stating
 * this. Replaced concept-by-concept when automated ingestion (P022) lands.
 *
 * Units: `values` are in each company's `unit` (usually millions of
 * `currency`); DilutedShares always in millions of shares.
 */

// chainOrder places each industry on the AI-hardware value chain (1 = most
// upstream): equipment -> foundry -> memory -> accelerators -> networking -> power.
export const INDUSTRIES = [
  { id: "semis-equipment", name: "Semiconductor Equipment", sector: "Semiconductors", chainOrder: 1 },
  { id: "semis-foundry", name: "Foundry & IDM", sector: "Semiconductors", chainOrder: 2 },
  { id: "semis-memory", name: "Memory (HBM / DRAM / NAND)", sector: "Semiconductors", chainOrder: 3 },
  { id: "semis-accelerators", name: "AI Accelerators & GPUs", sector: "Semiconductors", chainOrder: 4 },
  { id: "networking", name: "Networking & Custom ASIC", sector: "AI Infrastructure", chainOrder: 5 },
  { id: "dc-power-cooling", name: "Data Center Power & Cooling", sector: "AI Infrastructure", chainOrder: 6 },
];

/**
 * companies[].periods: label -> { concept: value }. Oldest first.
 * Facts use positive magnitudes for expenses/outflows (see api concepts.ts).
 */
export const COMPANIES = [
  {
    id: "nvidia",
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    exchange: "NASDAQ",
    segment: "GPU / AI Accelerators",
    country: "United States",
    industryId: "semis-accelerators",
    currency: "USD",
    fyEndMonth: 1,
    unit: "USD millions",
    headquarters: "Santa Clara, California",
    foundedYear: 1993,
    website: "https://www.nvidia.com",
    description:
      "Dominant supplier of AI training and inference accelerators; full-stack platform spanning GPUs, networking (Mellanox), and the CUDA software ecosystem.",
    fiscalNote: "Fiscal year ends late January (FY25 ended Jan 2025).",
    periods: [
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 26914, CostOfRevenue: 9439, RnDExpense: 5268, GnAExpense: 2166,
          OperatingIncome: 10041, NetIncome: 9752, IncomeTax: 189, InterestExpense: 236,
          OperatingCashFlow: 9108, Capex: 976, DepreciationAmortization: 1174,
          CashAndEquivalents: 21208, AccountsReceivable: 4650, Inventory: 2605,
          CurrentAssets: 28829, CurrentLiabilities: 4335,
          TotalAssets: 44187, LongTermDebt: 10946, TotalLiabilities: 17575, TotalEquity: 26612,
          DilutedShares: 25350,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 26974, CostOfRevenue: 11618, RnDExpense: 7339, GnAExpense: 2440,
          OperatingIncome: 4224, NetIncome: 4368,
          OperatingCashFlow: 5641, Capex: 1833, DepreciationAmortization: 1544,
          CashAndEquivalents: 13296, AccountsReceivable: 3827, Inventory: 5159,
          CurrentAssets: 23073, CurrentLiabilities: 6563,
          TotalAssets: 41182, LongTermDebt: 9703, TotalLiabilities: 19081, TotalEquity: 22101,
          DilutedShares: 24700, ShareRepurchases: 10039,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 60922, CostOfRevenue: 16621, RnDExpense: 8675, GnAExpense: 2654,
          OperatingIncome: 32972, NetIncome: 29760, IncomeTax: 4058, InterestExpense: 257,
          OperatingCashFlow: 28090, Capex: 1069, DepreciationAmortization: 1508,
          CashAndEquivalents: 25984, AccountsReceivable: 9999, Inventory: 5282,
          CurrentAssets: 44345, CurrentLiabilities: 10631,
          TotalAssets: 65728, LongTermDebt: 8459, TotalLiabilities: 22750, TotalEquity: 42978,
          DilutedShares: 24940, ShareRepurchases: 9533,
        },
      },
      {
        label: "FY25", fiscalYear: 2025,
        facts: {
          Revenue: 130497, CostOfRevenue: 32639, RnDExpense: 12914, GnAExpense: 3491,
          OperatingIncome: 81453, NetIncome: 72880, IncomeTax: 11146, InterestExpense: 247,
          OperatingCashFlow: 64089, Capex: 3236, DepreciationAmortization: 1864,
          CashAndEquivalents: 43210, AccountsReceivable: 23065, Inventory: 10080,
          CurrentAssets: 80126, CurrentLiabilities: 18047,
          TotalAssets: 111601, LongTermDebt: 8463, TotalLiabilities: 32274, TotalEquity: 79327,
          DilutedShares: 24804, ShareRepurchases: 33706,
        },
      },
    ],
  },
  {
    id: "tsmc",
    name: "Taiwan Semiconductor Mfg.",
    ticker: "TSM",
    exchange: "NYSE (ADR)",
    segment: "Foundry",
    country: "Taiwan",
    industryId: "semis-foundry",
    currency: "TWD",
    unit: "TWD millions",
    headquarters: "Hsinchu, Taiwan",
    foundedYear: 1987,
    website: "https://www.tsmc.com",
    description:
      "The world's leading dedicated foundry; manufactures virtually all leading-edge AI accelerators (N5/N4/N3) and leads advanced packaging (CoWoS).",
    fiscalNote: "Calendar fiscal year; figures in TWD millions.",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 1587415, CostOfRevenue: 767878, OperatingIncome: 649981, NetIncome: 597097,
          OperatingCashFlow: 1112160, Capex: 839196,
          CashAndEquivalents: 1064990, TotalAssets: 3725503, TotalEquity: 2175308,
          DilutedShares: 25932,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 2263891, CostOfRevenue: 915536, OperatingIncome: 1121279, NetIncome: 1016530,
          OperatingCashFlow: 1610599, Capex: 1082672,
          CashAndEquivalents: 1342814, TotalAssets: 4964459, TotalEquity: 2960492,
          DilutedShares: 25932,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 2161736, CostOfRevenue: 986625, OperatingIncome: 921466, NetIncome: 838498,
          OperatingCashFlow: 1241979, Capex: 949517,
          CashAndEquivalents: 1465428, TotalAssets: 5532196, TotalEquity: 3458314,
          DilutedShares: 25932,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 2894308, CostOfRevenue: 1269954, OperatingIncome: 1322050, NetIncome: 1173268,
          OperatingCashFlow: 1826079, Capex: 913024,
          CashAndEquivalents: 2127627, TotalAssets: 6691765, TotalEquity: 4306743,
          DilutedShares: 25932,
        },
      },
    ],
  },
  {
    id: "amd",
    name: "Advanced Micro Devices",
    ticker: "AMD",
    exchange: "NASDAQ",
    segment: "CPU / GPU / AI Accelerators",
    country: "United States",
    industryId: "semis-accelerators",
    currency: "USD",
    fyEndMonth: 12,
    unit: "USD millions",
    headquarters: "Santa Clara, California",
    foundedYear: 1969,
    website: "https://www.amd.com",
    description:
      "x86 CPUs (EPYC, Ryzen), Instinct AI accelerators, and adaptive computing (Xilinx). Primary challenger to NVIDIA in data-center AI.",
    fiscalNote: "Calendar fiscal year. 2022+ includes Xilinx acquisition (goodwill, amortization).",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 16434, CostOfRevenue: 8505, RnDExpense: 2845, SnMExpense: 1448,
          OperatingIncome: 3648, NetIncome: 3162, IncomeTax: 513,
          OperatingCashFlow: 3521, Capex: 301,
          CashAndEquivalents: 3608, TotalAssets: 12419, TotalEquity: 7497,
          DilutedShares: 1229,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 23601, CostOfRevenue: 12998, RnDExpense: 5005, SnMExpense: 2336,
          OperatingIncome: 1264, NetIncome: 1320,
          OperatingCashFlow: 3565, Capex: 450, DepreciationAmortization: 4174,
          CashAndEquivalents: 5855, TotalAssets: 67580, TotalEquity: 54750,
          DilutedShares: 1571,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 22680, CostOfRevenue: 12220, RnDExpense: 5872, SnMExpense: 2352,
          OperatingIncome: 401, NetIncome: 854,
          OperatingCashFlow: 1667, Capex: 546,
          CashAndEquivalents: 5773, TotalAssets: 67885, TotalEquity: 55892,
          DilutedShares: 1625,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 25785, CostOfRevenue: 12206, RnDExpense: 6456, SnMExpense: 2783,
          OperatingIncome: 1900, NetIncome: 1641, IncomeTax: 302,
          OperatingCashFlow: 3041, Capex: 636,
          CashAndEquivalents: 5132, TotalAssets: 69226, TotalEquity: 57568,
          DilutedShares: 1637,
        },
      },
    ],
  },
  {
    id: "asml",
    name: "ASML Holding",
    ticker: "ASML",
    exchange: "NASDAQ",
    segment: "Lithography",
    country: "Netherlands",
    industryId: "semis-equipment",
    currency: "EUR",
    unit: "EUR millions",
    headquarters: "Veldhoven, Netherlands",
    foundedYear: 1984,
    website: "https://www.asml.com",
    description:
      "Monopoly supplier of EUV lithography systems — the critical tool for leading-edge logic and DRAM manufacturing.",
    fiscalNote: "Calendar fiscal year; figures in EUR millions.",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 18611, CostOfRevenue: 8850, RnDExpense: 2547, GnAExpense: 725,
          OperatingIncome: 6846, NetIncome: 5883,
          OperatingCashFlow: 10845, Capex: 971,
          CashAndEquivalents: 7586, TotalAssets: 30432, TotalEquity: 10047,
          DilutedShares: 410,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 21173, CostOfRevenue: 10300, RnDExpense: 3254, GnAExpense: 903,
          OperatingIncome: 6802, NetIncome: 5624,
          OperatingCashFlow: 8487, Capex: 1289,
          CashAndEquivalents: 7268, TotalAssets: 36296, TotalEquity: 8634,
          DilutedShares: 397,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 27559, CostOfRevenue: 13134, RnDExpense: 3981, GnAExpense: 1113,
          OperatingIncome: 9045, NetIncome: 7839,
          OperatingCashFlow: 5443, Capex: 2027,
          CashAndEquivalents: 7059, TotalAssets: 39958, TotalEquity: 13839,
          DilutedShares: 395,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 28263, CostOfRevenue: 13911, RnDExpense: 4300, GnAExpense: 1146,
          OperatingIncome: 8977, NetIncome: 7572,
          OperatingCashFlow: 11169, Capex: 1704,
          CashAndEquivalents: 12736, TotalAssets: 48017, TotalEquity: 18477,
          DilutedShares: 394,
        },
      },
    ],
  },
  {
    id: "broadcom",
    name: "Broadcom",
    ticker: "AVGO",
    exchange: "NASDAQ",
    segment: "Networking / Custom ASIC",
    country: "United States",
    industryId: "networking",
    currency: "USD",
    fyEndMonth: 11,
    unit: "USD millions",
    headquarters: "Palo Alto, California",
    foundedYear: 1961,
    website: "https://www.broadcom.com",
    description:
      "AI networking silicon (Tomahawk/Jericho), custom AI accelerators (XPUs) for hyperscalers, plus infrastructure software (VMware).",
    fiscalNote: "Fiscal year ends late Oct/Nov. FY24 includes VMware (acquired Nov 2023). Shares split-adjusted (10:1, Jul 2024).",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 27450, CostOfRevenue: 10606, RnDExpense: 4854, GnAExpense: 1347,
          OperatingIncome: 8519, NetIncome: 6736,
          OperatingCashFlow: 13764, Capex: 443,
          CashAndEquivalents: 12163, TotalAssets: 75570, LongTermDebt: 39440, TotalEquity: 24962,
          DilutedShares: 4450,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 33203, CostOfRevenue: 11069, RnDExpense: 4919, GnAExpense: 1382,
          OperatingIncome: 14225, NetIncome: 11495,
          OperatingCashFlow: 16736, Capex: 424,
          CashAndEquivalents: 12416, TotalAssets: 73249, LongTermDebt: 39075, TotalEquity: 22709,
          DilutedShares: 4390,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 35819, CostOfRevenue: 11129, RnDExpense: 5253, GnAExpense: 1592,
          OperatingIncome: 16207, NetIncome: 14082,
          OperatingCashFlow: 18085, Capex: 452,
          CashAndEquivalents: 14189, TotalAssets: 72861, LongTermDebt: 37621, TotalEquity: 23988,
          DilutedShares: 4450,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 51574, CostOfRevenue: 19065, RnDExpense: 9310, GnAExpense: 4959,
          OperatingIncome: 13462, NetIncome: 5895,
          OperatingCashFlow: 19962, Capex: 548,
          CashAndEquivalents: 9348, TotalAssets: 165645, LongTermDebt: 66295, TotalEquity: 67678,
          DilutedShares: 4752,
        },
      },
    ],
  },
  {
    id: "micron",
    name: "Micron Technology",
    ticker: "MU",
    exchange: "NASDAQ",
    segment: "Memory (DRAM / NAND / HBM)",
    country: "United States",
    industryId: "semis-memory",
    currency: "USD",
    fyEndMonth: 9,
    unit: "USD millions",
    headquarters: "Boise, Idaho",
    foundedYear: 1978,
    website: "https://www.micron.com",
    description:
      "One of three DRAM manufacturers worldwide; HBM3E supplier into AI accelerators. Deeply cyclical memory economics.",
    fiscalNote: "Fiscal year ends late Aug/Sep (FY25 ended Aug 2025). FY23 was a severe memory downcycle.",
    periods: [
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 30758, CostOfRevenue: 16860, RnDExpense: 3116, GnAExpense: 1066,
          OperatingIncome: 9702, NetIncome: 8687,
          OperatingCashFlow: 15181, Capex: 12067,
          CashAndEquivalents: 9574, AccountsReceivable: 5130, Inventory: 6663,
          TotalAssets: 66283, LongTermDebt: 6938, TotalEquity: 49907,
          DilutedShares: 1116,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 15540, CostOfRevenue: 16956, RnDExpense: 3114, GnAExpense: 920,
          OperatingIncome: -5745, NetIncome: -5833,
          OperatingCashFlow: 1559, Capex: 7676,
          CashAndEquivalents: 9608, AccountsReceivable: 2443, Inventory: 8387,
          TotalAssets: 64254, LongTermDebt: 13052, TotalEquity: 44120,
          DilutedShares: 1094,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 25111, CostOfRevenue: 19498, RnDExpense: 3430, GnAExpense: 1129,
          OperatingIncome: 1304, NetIncome: 778,
          OperatingCashFlow: 8507, Capex: 8386,
          CashAndEquivalents: 9155, AccountsReceivable: 6615, Inventory: 8875,
          TotalAssets: 69416, LongTermDebt: 13396, TotalEquity: 45131,
          DilutedShares: 1114,
        },
      },
      {
        label: "FY25", fiscalYear: 2025,
        facts: {
          Revenue: 37378, CostOfRevenue: 22504, NetIncome: 8539,
          OperatingCashFlow: 17530, Capex: 13807,
          DilutedShares: 1130,
        },
      },
    ],
  },
  {
    id: "sk-hynix",
    name: "SK hynix",
    ticker: "000660",
    exchange: "KRX",
    segment: "HBM / DRAM",
    country: "South Korea",
    industryId: "semis-memory",
    currency: "KRW",
    unit: "KRW billions",
    headquarters: "Icheon, South Korea",
    foundedYear: 1983,
    website: "https://www.skhynix.com",
    description:
      "HBM market leader and primary memory supplier for NVIDIA AI accelerators; #2 DRAM manufacturer worldwide.",
    fiscalNote: "Calendar fiscal year; figures in KRW billions. Income-statement coverage only in seed.",
    periods: [
      { label: "FY21", fiscalYear: 2021, facts: { Revenue: 42998, OperatingIncome: 12410, NetIncome: 9616 } },
      { label: "FY22", fiscalYear: 2022, facts: { Revenue: 44648, OperatingIncome: 6809, NetIncome: 2242 } },
      { label: "FY23", fiscalYear: 2023, facts: { Revenue: 32766, OperatingIncome: -7730, NetIncome: -9138 } },
      { label: "FY24", fiscalYear: 2024, facts: { Revenue: 66193, OperatingIncome: 23467, NetIncome: 19797 } },
    ],
  },
  {
    id: "intel",
    name: "Intel Corporation",
    ticker: "INTC",
    exchange: "NASDAQ",
    segment: "CPU / Foundry",
    country: "United States",
    industryId: "semis-foundry",
    currency: "USD",
    fyEndMonth: 12,
    unit: "USD millions",
    headquarters: "Santa Clara, California",
    foundedYear: 1968,
    website: "https://www.intel.com",
    description:
      "x86 CPU incumbent rebuilding process leadership and standing up a western foundry (Intel Foundry). 2024 marked by heavy restructuring and impairments.",
    fiscalNote: "Calendar fiscal year.",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 79024, CostOfRevenue: 35209, RnDExpense: 15190, GnAExpense: 6543,
          OperatingIncome: 19456, NetIncome: 19868,
          OperatingCashFlow: 29456, Capex: 20329,
          CashAndEquivalents: 28413, TotalAssets: 168406, LongTermDebt: 33510, TotalEquity: 95391,
          DilutedShares: 4090,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 63054, CostOfRevenue: 36188, RnDExpense: 17528, GnAExpense: 7002,
          OperatingIncome: 2334, NetIncome: 8014,
          OperatingCashFlow: 15433, Capex: 24844,
          CashAndEquivalents: 28338, TotalAssets: 182103, LongTermDebt: 37684, TotalEquity: 101423,
          DilutedShares: 4123,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 54228, CostOfRevenue: 32517, RnDExpense: 16046, GnAExpense: 5634,
          OperatingIncome: 93, NetIncome: 1689,
          OperatingCashFlow: 11471, Capex: 25750,
          CashAndEquivalents: 25034, TotalAssets: 191572, LongTermDebt: 46978, TotalEquity: 105590,
          DilutedShares: 4212,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 53101, CostOfRevenue: 35756, RnDExpense: 16546, GnAExpense: 5507,
          OperatingIncome: -11678, NetIncome: -18756,
          OperatingCashFlow: 8288, Capex: 23944,
          CashAndEquivalents: 22062, TotalAssets: 196485, LongTermDebt: 46282, TotalEquity: 99270,
          DilutedShares: 4280,
        },
      },
    ],
  },
  {
    id: "arista",
    name: "Arista Networks",
    ticker: "ANET",
    exchange: "NYSE",
    segment: "Data Center Networking",
    country: "United States",
    industryId: "networking",
    currency: "USD",
    fyEndMonth: 12,
    unit: "USD millions",
    headquarters: "Santa Clara, California",
    foundedYear: 2004,
    website: "https://www.arista.com",
    description:
      "Leader in high-speed data-center Ethernet switching; core networking supplier to hyperscale AI clusters (Microsoft, Meta).",
    fiscalNote: "Calendar fiscal year. Shares split-adjusted (4:1, Dec 2024).",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 2948, CostOfRevenue: 1056, RnDExpense: 587, SnMExpense: 313,
          OperatingIncome: 906, NetIncome: 841,
          OperatingCashFlow: 951, Capex: 27,
          CashAndEquivalents: 3437, TotalAssets: 5320, TotalEquity: 3987,
          DilutedShares: 1264,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 4381, CostOfRevenue: 1724, RnDExpense: 728, SnMExpense: 393,
          OperatingIncome: 1536, NetIncome: 1352,
          OperatingCashFlow: 493, Capex: 45,
          CashAndEquivalents: 3024, TotalAssets: 7000, TotalEquity: 4865,
          DilutedShares: 1256,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 5860, CostOfRevenue: 2244, RnDExpense: 875, SnMExpense: 465,
          OperatingIncome: 2276, NetIncome: 2087,
          OperatingCashFlow: 2034, Capex: 47,
          CashAndEquivalents: 5271, TotalAssets: 9950, TotalEquity: 7319,
          DilutedShares: 1268,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 7003, CostOfRevenue: 2507, RnDExpense: 1000, SnMExpense: 530,
          OperatingIncome: 2966, NetIncome: 2852,
          OperatingCashFlow: 3708, Capex: 32,
          CashAndEquivalents: 8300, TotalAssets: 14043, TotalEquity: 9982,
          DilutedShares: 1280,
        },
      },
    ],
  },
  {
    id: "vertiv",
    name: "Vertiv Holdings",
    ticker: "VRT",
    exchange: "NYSE",
    segment: "Data Center Power / Cooling",
    country: "United States",
    industryId: "dc-power-cooling",
    currency: "USD",
    fyEndMonth: 12,
    unit: "USD millions",
    headquarters: "Westerville, Ohio",
    foundedYear: 2016,
    website: "https://www.vertiv.com",
    description:
      "Critical digital infrastructure: power management, thermal management (incl. liquid cooling) for AI data centers.",
    fiscalNote: "Calendar fiscal year. Spun out of Emerson Network Power (2016); listed 2020.",
    periods: [
      {
        label: "FY21", fiscalYear: 2021,
        facts: {
          Revenue: 4998, CostOfRevenue: 3417, OperatingIncome: 320, NetIncome: 120,
        },
      },
      {
        label: "FY22", fiscalYear: 2022,
        facts: {
          Revenue: 5692, CostOfRevenue: 4081, OperatingIncome: 216, NetIncome: 77,
        },
      },
      {
        label: "FY23", fiscalYear: 2023,
        facts: {
          Revenue: 6863, CostOfRevenue: 4428, OperatingIncome: 872, NetIncome: 460,
          OperatingCashFlow: 778, Capex: 92,
        },
      },
      {
        label: "FY24", fiscalYear: 2024,
        facts: {
          Revenue: 8012, CostOfRevenue: 5080, OperatingIncome: 1376, NetIncome: 496,
          OperatingCashFlow: 1336, Capex: 200,
          TotalAssets: 9132, LongTermDebt: 2929, TotalEquity: 2666,
          DilutedShares: 388,
        },
      },
    ],
  },
];
