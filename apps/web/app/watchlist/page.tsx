import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <AppShell title="Watchlist">
      <ComingSoon
        eyebrow="Positions"
        title="Watchlist"
        description="Tracked companies with quick signals and score movement."
        points={[
          "Tracked companies",
          "Score and estimate changes",
          "Quick-glance signals",
        ]}
      />
    </AppShell>
  );
}
