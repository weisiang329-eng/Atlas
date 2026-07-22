/**
 * FX rates from Bank Negara Malaysia (docs/PORTFOLIO-ACCOUNTING.md §5).
 *
 * BNM is the anchor the owner chose for the trade book: bookkeeping uses the
 * central bank MIDDLE rate, and the broker's dealing spread is booked
 * separately as an `fx_spread` fee. That keeps two different questions apart —
 * "did the ringgit move for me?" and "what did conversion cost me?" — which a
 * dealing rate silently merges.
 *
 * The API is public, free and needs no key, so this needs nothing from the
 * owner to run. It quotes FOREIGN → MYR per unit, which is exactly the
 * direction the ledger stores (trade currency → base).
 */

const BNM_URL = "https://api.bnm.gov.my/public/exchange-rate";

/** The currencies Atlas trades in. MYR is the base and never converted. */
export const TRACKED_CURRENCIES = ["USD", "HKD", "SGD"] as const;

interface BnmRate {
  currency_code: string;
  unit: number;
  rate: {
    date: string;
    buying_rate: number;
    selling_rate: number;
    middle_rate: number;
  } | null;
}

export interface FxQuote {
  date: string;
  fromCurrency: string;
  toCurrency: "MYR";
  /** Middle rate per ONE unit of the foreign currency. */
  rate: number;
  /**
   * Half the buy/sell spread, as a fraction of mid. The dealing cost a broker
   * charges is at least this; recorded so the ledger can distinguish currency
   * performance from conversion cost.
   */
  halfSpreadPct: number | null;
}

/**
 * Fetch today's middle rates. Returns only the tracked currencies that BNM
 * actually quoted — a missing currency yields no row rather than a stale or
 * invented one.
 */
export async function fetchBnmRates(): Promise<FxQuote[]> {
  const res = await fetch(BNM_URL, {
    headers: {
      // BNM requires this Accept header; without it the API returns 406.
      Accept: "application/vnd.BNM.API.v1+json",
      "User-Agent": "Atlas Research Platform",
    },
  });
  if (!res.ok) {
    throw new Error(`BNM API ${res.status}`);
  }

  const body = (await res.json()) as { data?: BnmRate[] };
  const rows = body.data ?? [];
  const quotes: FxQuote[] = [];

  for (const code of TRACKED_CURRENCIES) {
    const row = rows.find((r) => r.currency_code === code);
    if (!row?.rate) continue;

    // BNM quotes some currencies per 100 units (e.g. JPY). Normalise to one.
    const unit = row.unit > 0 ? row.unit : 1;
    const mid = row.rate.middle_rate / unit;
    if (!Number.isFinite(mid) || mid <= 0) continue;

    const buy = row.rate.buying_rate / unit;
    const sell = row.rate.selling_rate / unit;
    const halfSpreadPct =
      Number.isFinite(buy) && Number.isFinite(sell) && mid > 0
        ? Math.round(((sell - buy) / 2 / mid) * 1e6) / 1e4
        : null;

    quotes.push({
      date: row.rate.date,
      fromCurrency: code,
      toCurrency: "MYR",
      rate: Math.round(mid * 1e6) / 1e6,
      halfSpreadPct,
    });
  }

  return quotes;
}
