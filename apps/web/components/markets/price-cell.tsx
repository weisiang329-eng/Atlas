"use client";

import { usePriceFlash } from "@/lib/use-price-flash";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Price cell — flashes green/up or red/down for ~650ms when the value changes. */
export function PriceCell({ value, currency }: { value: number; currency: string }) {
  const flash = usePriceFlash(value);
  return (
    <span className={cn("num inline-block rounded px-1.5 py-0.5 transition-colors", flash)}>
      {formatCurrency(value, currency)}
    </span>
  );
}

/** Change % cell — semantic colour + flash, matches the price glyph rule. */
export function ChangeCell({ value }: { value: number }) {
  const flash = usePriceFlash(value);
  const tone = value >= 0 ? "text-positive" : "text-negative";
  return (
    <span className={cn("num inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors", tone, flash)}>
      <span aria-hidden>{value >= 0 ? "▲" : "▼"}</span>
      {formatPercent(value)}
    </span>
  );
}
