import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PortfolioLive } from "@/components/portfolio/portfolio-live";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <AppShell title="Portfolio">
      <PageHeader
        eyebrowKey="page.portfolio.eyebrow"
        titleKey="page.portfolio.title"
        descriptionKey="page.portfolio.desc"
      />
      <PortfolioLive />
    </AppShell>
  );
}
