"use client";

/**
 * Trade entry. Fees default to the market schedule's estimate so the common
 * case is one less thing to type, but the field stays editable — the actual
 * charge from a contract note always wins (PORTFOLIO-ACCOUNTING §6).
 */
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  MARKET_CURRENCY,
  type Market,
  type NewTrade,
  type Side,
} from "@/lib/loaders/use-book";
import { useT } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/cn";

/**
 * Client-side mirror of the server fee schedule, so the estimate shown while
 * typing matches what the engine will book. Kept deliberately small; the
 * server remains the authority once the API routes land.
 */
function estimateFees(market: Market, side: Side, qty: number, price: number): number {
  const value = qty * price;
  if (!value) return 0;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  switch (market) {
    case "MY":
      return r2(
        Math.max(8, value * 0.001) +
          Math.min(1000, value * 0.0003) +
          Math.min(1000, Math.ceil(value / 1000) * 1.5),
      );
    case "US": {
      let f = Math.max(0.99, qty * 0.0049) + Math.max(1, qty * 0.005) + qty * 0.003;
      if (side === "sell") f += value * 0.0000278 + Math.min(8.3, qty * 0.000166);
      return r2(f);
    }
    case "HK":
      return r2(
        Math.max(3, value * 0.0003) +
          15 +
          Math.ceil(value * 0.001) +
          value * 0.0000027 +
          value * 0.0000565 +
          Math.min(100, Math.max(2, value * 0.00002)),
      );
    case "SG":
      return r2(
        Math.max(0.99, value * 0.0008) +
          1 +
          Math.min(600, value * 0.000325) +
          value * 0.0000075,
      );
  }
}

/** Indicative MYR rates — replaced by BNM mid-rates when the API lands. */
const DEFAULT_FX: Record<string, number> = {
  MYR: 1,
  USD: 4.7,
  HKD: 0.6,
  SGD: 3.5,
};

const FIELD =
  "w-full rounded border border-border bg-surface-3 px-2.5 py-1.5 text-sm text-fg placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
const LABEL = "mb-1 block font-mono text-2xs uppercase tracking-[0.08em] text-faint";

export function TradeEntryForm({
  onAdd,
}: {
  onAdd: (t: NewTrade) => void | Promise<void>;
}) {
  const t = useT();
  const [side, setSide] = useState<Side>("buy");
  const [market, setMarket] = useState<Market>("US");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [tradedAt, setTradedAt] = useState("");
  const [feeOverride, setFeeOverride] = useState("");
  const [fxRate, setFxRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currency = MARKET_CURRENCY[market];
  const qty = Number(quantity) || 0;
  const px = Number(price) || 0;

  const estimated = useMemo(
    () => estimateFees(market, side, qty, px),
    [market, side, qty, px],
  );
  const fees = feeOverride === "" ? estimated : Number(feeOverride) || 0;
  const fx = fxRate === "" ? (DEFAULT_FX[currency] ?? 1) : Number(fxRate) || 1;
  const valid = symbol.trim() !== "" && qty > 0 && px > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      // `currency` is deliberately not sent: the server derives it from the
      // market, so that mapping has exactly one home.
      await onAdd({
        symbol: symbol.trim().toUpperCase(),
        market,
        side,
        quantity: qty,
        price: px,
        fxRate: fx,
        // Same ISO shape the broker importer will use.
        tradedAt: tradedAt ? `${tradedAt}T00:00:00Z` : new Date().toISOString(),
        // Only send a fee when the user overrode it; otherwise the server's
        // schedule is authoritative.
        ...(feeOverride === "" ? {} : { fees }),
      });
      setSymbol("");
      setQuantity("");
      setPrice("");
      setFeeOverride("");
    } catch (err) {
      // The API returns a specific validation message; showing "something went
      // wrong" would leave the user guessing which field to fix.
      setSubmitError(
        err instanceof Error ? err.message : "Could not save the trade.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex rounded border border-border bg-bg p-0.5" role="group">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => setSide(s)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 font-mono text-2xs uppercase tracking-wide transition-colors",
              side === s
                ? s === "buy"
                  ? "bg-positive/15 text-positive"
                  : "bg-warning/15 text-warning"
                : "text-faint hover:text-fg",
            )}
          >
            {s === "buy" ? t("ledger.buy") : t("ledger.sell")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL} htmlFor="tr-market">{t("ledger.market")}</label>
          <select
            id="tr-market"
            value={market}
            onChange={(e) => setMarket(e.target.value as Market)}
            className={FIELD}
          >
            <option value="US">US · USD</option>
            <option value="MY">Bursa · MYR</option>
            <option value="HK">HK · HKD</option>
            <option value="SG">SG · SGD</option>
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="tr-symbol">{t("ledger.symbol")}</label>
          <input
            id="tr-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="NVDA"
            className={cn(FIELD, "font-mono uppercase")}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="tr-qty">{t("ledger.qty")}</label>
          <input
            id="tr-qty"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={cn(FIELD, "num")}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="tr-price">{t("ledger.price")}</label>
          <input
            id="tr-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={cn(FIELD, "num")}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="tr-date">{t("ledger.date")}</label>
          <input
            id="tr-date"
            type="date"
            value={tradedAt}
            onChange={(e) => setTradedAt(e.target.value)}
            className={cn(FIELD, "num")}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="tr-fx">
            {t("ledger.fxRate")} {currency}/MYR
          </label>
          <input
            id="tr-fx"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={fxRate}
            onChange={(e) => setFxRate(e.target.value)}
            placeholder={String(DEFAULT_FX[currency] ?? 1)}
            className={cn(FIELD, "num")}
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="tr-fee">
          {t("ledger.fees")} ({currency})
        </label>
        <div className="flex items-center gap-2">
          <input
            id="tr-fee"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={feeOverride}
            onChange={(e) => setFeeOverride(e.target.value)}
            placeholder={String(estimated)}
            className={cn(FIELD, "num")}
          />
          <Badge tone={feeOverride === "" ? "neutral" : "info"}>
            {feeOverride === "" ? t("ledger.estimated") : t("ledger.actual")}
          </Badge>
        </div>
      </div>

      {valid ? (
        <p className="rounded bg-surface-3 px-2.5 py-2 text-2xs text-muted">
          {t("ledger.willBook")}{" "}
          <span className="num text-fg">
            {(qty * px).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
          </span>{" "}
          + <span className="num text-fg">{fees} {currency}</span>{" "}
          {t("ledger.feesShort")} ≈{" "}
          <span className="num text-fg">
            RM {((qty * px + (side === "buy" ? fees : -fees)) * fx).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </p>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="rounded border border-negative/40 bg-negative/10 px-2.5 py-2 text-2xs text-negative"
        >
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!valid || saving}
        className="rounded bg-accent px-3 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {saving ? t("common.loading") : t("ledger.record")}
      </button>
    </form>
  );
}
