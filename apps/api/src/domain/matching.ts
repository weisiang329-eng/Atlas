/**
 * Lot matching and P&L (docs/PORTFOLIO-ACCOUNTING.md §2–§4).
 *
 * This is the core of the trade book. A sell consumes open lots by the
 * configured rule (FIFO today) and produces one closure per lot consumed —
 * and that closure IS the per-order profit record.
 *
 * Everything here is pure: given lots and a sell, produce closures. No I/O, no
 * dates from the clock, no randomness — so it is deterministic, testable, and
 * re-runnable without changing history.
 */

export type MatchRule = "fifo" | "lifo" | "hifo";

/** An open tranche available to be closed. */
export interface OpenLot {
  id: number;
  openedAt: string;
  originalQty: number;
  remainingQty: number;
  /** Per share, trade currency, excluding fees. */
  costPrice: number;
  /** Buy-side fees for the WHOLE lot, trade currency. */
  feesTotal: number;
  currency: string;
  /** Trade currency -> base, at the buy date. */
  fxRate: number;
}

export interface SellInput {
  tradeId: number;
  closedAt: string;
  quantity: number;
  price: number;
  currency: string;
  /** Trade currency -> base, at the sell date. */
  fxRate: number;
  /** Sell-side fees for the WHOLE sell, trade currency. */
  feesTotal: number;
}

/** One lot consumed by one sell — the per-order profit record. */
export interface Closure {
  lotId: number;
  sellTradeId: number;
  closedAt: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  /** Buy fees pro-rata for this quantity + this closure's share of sell fees. */
  feesLocal: number;
  grossPlLocal: number;
  netPlLocal: number;
  currency: string;
  buyFxRate: number;
  sellFxRate: number;
  /** Gross, in base currency. price + fx components sum to this exactly. */
  totalPlBase: number;
  pricePlBase: number;
  fxPlBase: number;
  /** After fees, in base currency — the "扣了水钱之后" number. */
  netPlBase: number;
}

export interface MatchResult {
  closures: Closure[];
  /** Lots with their remaining quantity after this sell. */
  updatedLots: { id: number; remainingQty: number }[];
  /** Quantity the sell could not cover from open lots (should be 0). */
  unmatchedQty: number;
}

const round = (v: number, dp = 6) => Math.round(v * 10 ** dp) / 10 ** dp;

/** Order lots for consumption. FIFO = oldest first (ties broken by lot id). */
function orderLots(lots: OpenLot[], rule: MatchRule): OpenLot[] {
  const open = lots.filter((l) => l.remainingQty > 0);
  switch (rule) {
    case "lifo":
      return open.sort((a, b) =>
        a.openedAt === b.openedAt ? b.id - a.id : a.openedAt < b.openedAt ? 1 : -1,
      );
    case "hifo":
      return open.sort((a, b) => b.costPrice - a.costPrice || a.id - b.id);
    case "fifo":
    default:
      return open.sort((a, b) =>
        a.openedAt === b.openedAt ? a.id - b.id : a.openedAt < b.openedAt ? -1 : 1,
      );
  }
}

/**
 * Match a sell against open lots.
 *
 * Fee allocation: buy fees are apportioned pro-rata by the fraction of the lot
 * being closed; sell fees are apportioned pro-rata by the fraction of the sell
 * that this closure represents. Both are the standard institutional treatment
 * and keep total allocated fees exactly equal to fees charged.
 */
export function matchSell(
  lots: OpenLot[],
  sell: SellInput,
  rule: MatchRule = "fifo",
): MatchResult {
  const ordered = orderLots(lots, rule);
  const closures: Closure[] = [];
  const updated = new Map<number, number>();
  let toFill = sell.quantity;

  for (const lot of ordered) {
    if (toFill <= 0) break;
    const qty = Math.min(lot.remainingQty, toFill);
    if (qty <= 0) continue;

    // Fees: buy side pro-rata of the lot; sell side pro-rata of the sell.
    const buyFeeShare =
      lot.originalQty > 0 ? (lot.feesTotal * qty) / lot.originalQty : 0;
    const sellFeeShare =
      sell.quantity > 0 ? (sell.feesTotal * qty) / sell.quantity : 0;
    const feesLocal = round(buyFeeShare + sellFeeShare, 2);

    const proceedsLocal = qty * sell.price;
    const costLocal = qty * lot.costPrice;
    const grossPlLocal = round(proceedsLocal - costLocal, 6);
    const netPlLocal = round(grossPlLocal - feesLocal, 6);

    // Base-currency decomposition (PORTFOLIO-ACCOUNTING §4):
    //   total = q·P₁·R₁ − q·P₀·R₀
    //   price = q·(P₁ − P₀)·R₀      ← the stock moved
    //   fx    = q·P₁·(R₁ − R₀)      ← the ringgit moved
    // These sum to total exactly; db:test asserts it.
    const totalPlBase = round(
      qty * sell.price * sell.fxRate - qty * lot.costPrice * lot.fxRate,
      6,
    );
    const pricePlBase = round(qty * (sell.price - lot.costPrice) * lot.fxRate, 6);
    const fxPlBase = round(qty * sell.price * (sell.fxRate - lot.fxRate), 6);
    // Fees are charged in the trade currency; convert buy-side fees at the buy
    // rate and sell-side at the sell rate, matching when each was actually paid.
    const feesBase = round(
      buyFeeShare * lot.fxRate + sellFeeShare * sell.fxRate,
      6,
    );
    const netPlBase = round(totalPlBase - feesBase, 6);

    closures.push({
      lotId: lot.id,
      sellTradeId: sell.tradeId,
      closedAt: sell.closedAt,
      quantity: qty,
      costPrice: lot.costPrice,
      sellPrice: sell.price,
      feesLocal,
      grossPlLocal,
      netPlLocal,
      currency: sell.currency,
      buyFxRate: lot.fxRate,
      sellFxRate: sell.fxRate,
      totalPlBase,
      pricePlBase,
      fxPlBase,
      netPlBase,
    });

    const remaining = round(lot.remainingQty - qty, 6);
    updated.set(lot.id, remaining);
    toFill = round(toFill - qty, 6);
  }

  return {
    closures,
    updatedLots: [...updated].map(([id, remainingQty]) => ({ id, remainingQty })),
    unmatchedQty: round(Math.max(0, toFill), 6),
  };
}

/* ── Position aggregation (总仓) ─────────────────────────────────────── */

export interface Position {
  instrumentId: string;
  quantity: number;
  /** Σ (remaining qty × cost price), trade currency — excludes fees. */
  costTotal: number;
  /** Σ (remaining qty × cost price) + unclosed share of buy fees. */
  costTotalWithFees: number;
  /** costTotal ÷ quantity — the plain average price. */
  averagePrice: number;
  /** costTotalWithFees ÷ quantity — true break-even including entry fees. */
  averagePriceWithFees: number;
  costTotalBase: number;
  currency: string;
  openLots: number;
}

/**
 * Aggregate open lots into a position. Average price is cost-weighted, which
 * is the only definition consistent with lot accounting: it always equals
 * total cost ÷ total quantity.
 */
export function buildPosition(
  instrumentId: string,
  lots: OpenLot[],
): Position | null {
  const open = lots.filter((l) => l.remainingQty > 0);
  if (open.length === 0) return null;

  let quantity = 0;
  let costTotal = 0;
  let feesRemaining = 0;
  let costTotalBase = 0;

  for (const l of open) {
    quantity += l.remainingQty;
    costTotal += l.remainingQty * l.costPrice;
    // Only the fees attributable to the still-open share of the lot.
    feesRemaining +=
      l.originalQty > 0 ? (l.feesTotal * l.remainingQty) / l.originalQty : 0;
    costTotalBase += l.remainingQty * l.costPrice * l.fxRate;
  }

  const costTotalWithFees = costTotal + feesRemaining;
  return {
    instrumentId,
    quantity: round(quantity, 6),
    costTotal: round(costTotal, 4),
    costTotalWithFees: round(costTotalWithFees, 4),
    averagePrice: round(costTotal / quantity, 6),
    averagePriceWithFees: round(costTotalWithFees / quantity, 6),
    costTotalBase: round(costTotalBase, 4),
    currency: open[0]!.currency,
    openLots: open.length,
  };
}
