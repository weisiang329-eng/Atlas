"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { StatGrid } from "@/components/ui/stat-grid";
import { QuotesPanel } from "@/components/markets/quotes-panel";
import { INDEX_KPIS } from "@/lib/mock/markets";

export default function MarketsPage() {
  return (
    <>
      <SectionHeading
        title="Watchlist"
        description="Live-simulated quotes (1.5s tick) with price-flash, intraday and candlestick charts. Wire to the real quote-feed adapter per docs/design/P027-markets-design.md."
      />

      <div className="mb-6">
        <StatGrid
          items={INDEX_KPIS.map((k) => ({
            label: k.label,
            value: k.value,
            hint: k.delta,
          }))}
        />
      </div>

      <QuotesPanel />
    </>
  );
}
