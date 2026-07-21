/**
 * Broker fee schedule (docs/PORTFOLIO-ACCOUNTING.md §6).
 *
 * The Moomoo/Futu OpenAPI returns no fee fields on a deal, so Atlas computes
 * fees from a per-market schedule and marks them `estimated`. When the owner
 * reconciles against a statement, the actual amount replaces it and is marked
 * `actual`; the reconciliation report shows the drift.
 *
 * Rates are DATA, not logic: they drift with broker promotions and regulation.
 * Each schedule carries an `effectiveFrom` date so historical trades keep the
 * fees that applied when they happened.
 */

export type Market = "US" | "MY" | "HK" | "SG";
export type Side = "buy" | "sell";

export type FeeKind =
  | "commission"
  | "platform"
  | "stamp_duty"
  | "clearing"
  | "settlement"
  | "exchange"
  | "regulatory"
  | "fx_spread"
  | "other";

export interface FeeLine {
  kind: FeeKind;
  amount: number;
  currency: string;
}

export interface FeeInput {
  market: Market;
  side: Side;
  quantity: number;
  price: number;
  /** Trade date (ISO) — selects the schedule version in force. */
  tradedAt: string;
}

interface Schedule {
  effectiveFrom: string;
  currency: string;
  compute: (i: FeeInput, value: number) => FeeLine[];
}

const round = (v: number, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const line = (kind: FeeKind, amount: number, currency: string): FeeLine => ({
  kind,
  amount: round(Math.max(0, amount), 2),
  currency,
});

/**
 * Per-market schedules, newest first within each market. Figures follow
 * Moomoo's published retail rates and the statutory levies in force at the
 * effective date; override any trade with the actual charge when reconciling.
 */
const SCHEDULES: Record<Market, Schedule[]> = {
  // Commission + platform per share with minimums; regulatory levies on SELLS
  // only (SEC fee and FINRA TAF are sell-side charges).
  US: [
    {
      effectiveFrom: "2020-01-01",
      currency: "USD",
      compute: ({ side, quantity }, value) => {
        const out = [
          line("commission", Math.max(0.99, quantity * 0.0049), "USD"),
          line("platform", Math.max(1.0, quantity * 0.005), "USD"),
          line("settlement", quantity * 0.003, "USD"),
        ];
        if (side === "sell") {
          // SEC Section 31 fee on the sale value; FINRA TAF per share, capped.
          out.push(line("regulatory", value * 0.0000278, "USD"));
          out.push(line("regulatory", Math.min(8.3, quantity * 0.000166), "USD"));
        }
        return out;
      },
    },
  ],

  // Bursa: brokerage with a minimum, clearing 0.03% capped at RM1,000,
  // stamp duty RM1.50 per RM1,000 of contract value capped at RM1,000.
  MY: [
    {
      effectiveFrom: "2022-01-01",
      currency: "MYR",
      compute: (_i, value) => [
        line("commission", Math.max(8, value * 0.001), "MYR"),
        line("clearing", Math.min(1000, value * 0.0003), "MYR"),
        line("stamp_duty", Math.min(1000, Math.ceil(value / 1000) * 1.5), "MYR"),
      ],
    },
  ],

  // HK: commission + platform, stamp duty 0.1% rounded UP to the dollar,
  // SFC levy, AFRC levy, exchange trading fee, CCASS settlement (min/max).
  HK: [
    {
      effectiveFrom: "2023-01-01",
      currency: "HKD",
      compute: (_i, value) => [
        line("commission", Math.max(3, value * 0.0003), "HKD"),
        line("platform", 15, "HKD"),
        line("stamp_duty", Math.ceil(value * 0.001), "HKD"),
        line("regulatory", value * 0.0000027, "HKD"), // SFC transaction levy
        line("exchange", value * 0.0000565, "HKD"), // HKEX trading fee
        line("settlement", Math.min(100, Math.max(2, value * 0.00002)), "HKD"),
      ],
    },
  ],

  // SGX: commission + platform + clearing (capped) + SGX access fee.
  SG: [
    {
      effectiveFrom: "2023-01-01",
      currency: "SGD",
      compute: (_i, value) => [
        line("commission", Math.max(0.99, value * 0.0008), "SGD"),
        line("platform", 1.0, "SGD"),
        line("clearing", Math.min(600, value * 0.000325), "SGD"),
        line("exchange", value * 0.0000075, "SGD"),
      ],
    },
  ],
};

/** The schedule in force for a market at a trade date. */
function scheduleFor(market: Market, tradedAt: string): Schedule {
  const applicable = SCHEDULES[market]
    .filter((s) => s.effectiveFrom <= tradedAt)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  // Fall back to the oldest schedule rather than throwing: a trade dated before
  // any schedule still needs a defensible estimate, and it is marked estimated.
  return applicable[0] ?? SCHEDULES[market][SCHEDULES[market].length - 1]!;
}

/**
 * Estimated fees for a trade, itemised by kind. Amounts are in the market's
 * trading currency and are always non-negative.
 */
export function estimateFees(input: FeeInput): FeeLine[] {
  const value = input.quantity * input.price;
  const schedule = scheduleFor(input.market, input.tradedAt);
  return schedule
    .compute(input, value)
    .filter((f) => f.amount > 0)
    .reduce<FeeLine[]>((acc, f) => {
      // Merge same-kind lines (US has two regulatory levies) so a trade never
      // carries duplicate rows for one kind.
      const existing = acc.find((a) => a.kind === f.kind);
      if (existing) {
        existing.amount = round(existing.amount + f.amount, 2);
        return acc;
      }
      return [...acc, f];
    }, []);
}

/** Total fee amount for a trade, in the trading currency. */
export function totalFees(lines: FeeLine[]): number {
  return round(
    lines.reduce((a, f) => a + f.amount, 0),
    2,
  );
}
