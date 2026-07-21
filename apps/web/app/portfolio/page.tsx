import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PortfolioLive } from "@/components/portfolio/portfolio-live";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <AppShell title="Portfolio">
      <PageHeader
        eyebrow="Positions"
        title="Portfolio"
        description="Your holdings with cost-weighted exposure and Atlas Score quality. Cost basis only — market value and P&L arrive with live prices (P027). Not investment advice."
      />
      <PortfolioLive />
    </AppShell>
  );
}
