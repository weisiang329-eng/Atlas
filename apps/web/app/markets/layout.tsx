import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { MARKETS_TABS } from "@/lib/nav";

export default function MarketsLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Markets"
      eyebrow="P027 · Real-time markets"
      description="Watchlist quotes, intraday and daily candles. Structure and components only — every price is illustrative sample data (see mock notice below)."
      tabs={MARKETS_TABS}
    >
      {children}
    </WorkspaceLayout>
  );
}
