import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { WatchlistLive } from "@/components/watchlist/watchlist-live";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <AppShell title="Watchlist">
      <PageHeader
        eyebrow="Positions"
        title="Watchlist"
        description="Companies you follow, with their Atlas Score at a glance. Stored locally in your browser."
      />
      <WatchlistLive />
    </AppShell>
  );
}
