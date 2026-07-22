/**
 * Driver series computed from filings Atlas already stores.
 *
 * This is tier 4 of `adr/ADR-Data-Sourcing-Cost.md`: the cheapest source there
 * is, because the data is already in `financial_fact` and the only cost is
 * code — paid once, reused by every industry that follows.
 *
 * It is also where a substitution can quietly become a lie, so each entry
 * carries `measures`: a plain statement of what the number IS, which the API
 * hands to the UI verbatim. "Maker inventory days" is not "channel inventory
 * weeks"; DRAM's series computed from Micron and SK hynix is not DRAM-specific
 * because Micron also makes NAND and HBM. Both facts travel with the series
 * rather than living in someone's memory.
 *
 * What is deliberately NOT here: anything requiring numbers Atlas does not
 * hold. Capacity utilisation, bit shipment growth and CoWoS allocation are
 * disclosed in commentary, not in XBRL, so no amount of code produces them —
 * they are reclassified rather than approximated.
 */
import type { Observation } from "./drivers.ts";
import { placePeriod } from "./fiscal.ts";

export interface DerivationInput {
  companyId: string;
  fiscalYearEndMonth: number | null;
  periods: {
    reportDate: string | null;
    fiscalYear: number | null;
    fiscalQuarter: number | null;
    facts: Record<string, number | undefined>;
  }[];
}

export interface Derivation {
  /** Matches `industry_driver.series_key`. */
  key: string;
  label: string;
  unit: string;
  /** What the number actually is — rendered, not paraphrased. */
  measures: string;
  /**
   * Whose filings feed it. `"members"` means the companies filed under the
   * driver's own node, or the nearest ancestor that has any — memory drivers
   * hang off DRAM while the companies sit on 存储.
   */
  companies: "members" | string[];
  /**
   * Per-company, per-quarter value. Returning undefined drops that quarter
   * for that company — never a zero, which would silently drag an average.
   */
  perPeriod: (facts: Record<string, number | undefined>) => number | undefined;
  /** How company values combine into one industry observation. */
  combine: "sum" | "mean" | "weighted-by-revenue";
}

/** Days in a quarter, for turning a stock into days of flow. */
const QUARTER_DAYS = 91;

export const DERIVATIONS: Derivation[] = [
  {
    key: "inventory_days",
    label: "Maker inventory days (DSI)",
    unit: "days",
    measures:
      "The MAKERS' own inventory, expressed as days of cost of goods sold (Inventory ÷ COGS × 91). This is not channel inventory: it sits one step upstream of distributor stock, so it turns later than the channel and earlier than reported margin, and it can be inflated deliberately when a maker builds ahead of demand.",
    companies: "members",
    perPeriod: (f) => {
      const inv = f.Inventory;
      const cogs = f.CostOfRevenue;
      if (inv === undefined || cogs === undefined || cogs <= 0) return undefined;
      return Number(((inv / cogs) * QUARTER_DAYS).toFixed(2));
    },
    // Weighted, because the industry's inventory position is the big maker's
    // position; an unweighted mean lets the smallest filer set the level.
    combine: "weighted-by-revenue",
  },
  {
    key: "maker_capex",
    label: "Maker capital expenditure",
    unit: "USD millions",
    measures:
      "Capital expenditure reported by the makers filed under this node, summed. Today's capex is tomorrow's supply — the standard 4–6 quarter lag from spend to wafer output is a claim the backtest can check, not an assumption baked into the series.",
    companies: "members",
    perPeriod: (f) => f.Capex,
    combine: "sum",
  },
  {
    key: "fab_capex",
    label: "Fab capital expenditure (foundry + IDM + memory)",
    unit: "USD millions",
    measures:
      "Capex of the companies that actually build fabs — Intel, TSMC and Micron in the current universe — summed across the coverage that reports it. Equipment revenue follows this spend; the driver claims a 2–3 quarter lag. NOTE: this is the capex Atlas can see, not global fab capex; the coverage universe is missing Samsung, SK hynix's fabs and the Chinese foundries.",
    // A named cross-industry set: equipment demand comes from customers, not
    // from the equipment makers themselves.
    companies: ["intel", "tsmc", "micron"],
    perPeriod: (f) => f.Capex,
    combine: "sum",
  },
];

export const DERIVATION_BY_KEY = new Map(DERIVATIONS.map((d) => [d.key, d]));

/**
 * Compute one derivation into a quarterly series.
 *
 * Periods are placed on the calendar first (see domain/fiscal.ts): fiscal
 * quarters differ per company, and summing "Q1" across filers whose quarters
 * end in March, April and November produces a number describing nothing.
 */
export function deriveSeries(
  derivation: Derivation,
  inputs: DerivationInput[],
): Observation[] {
  const byQuarter = new Map<string, { values: number[]; weights: number[] }>();

  for (const input of inputs) {
    for (const p of input.periods) {
      const value = derivation.perPeriod(p.facts);
      if (value === undefined || !Number.isFinite(value)) continue;

      const { quarter } = placePeriod(p, input.fiscalYearEndMonth);
      if (!quarter) continue;

      const bucket = byQuarter.get(quarter) ?? { values: [], weights: [] };
      bucket.values.push(value);
      // Revenue is the weight when one is needed; a period without it falls
      // back to equal weight rather than dropping out of a sum.
      bucket.weights.push(p.facts.Revenue ?? 1);
      byQuarter.set(quarter, bucket);
    }
  }

  const out: Observation[] = [];
  for (const [quarter, { values, weights }] of byQuarter) {
    if (values.length === 0) continue;
    let value: number;
    if (derivation.combine === "sum") {
      value = values.reduce((a, b) => a + b, 0);
    } else if (derivation.combine === "mean") {
      value = values.reduce((a, b) => a + b, 0) / values.length;
    } else {
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      value =
        totalWeight > 0
          ? values.reduce((sum, v, i) => sum + v * weights[i]!, 0) / totalWeight
          : values.reduce((a, b) => a + b, 0) / values.length;
    }
    out.push({ quarter, value: Number(value.toFixed(3)) });
  }

  return out.sort((a, b) => a.quarter.localeCompare(b.quarter));
}
