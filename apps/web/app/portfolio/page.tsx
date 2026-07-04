import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <AppShell title="Portfolio">
      <ComingSoon
        eyebrow="Positions"
        title="Portfolio"
        description="Holdings, exposure and performance. Trading and execution are out of scope."
        points={[
          "Holdings and weightings",
          "Exposure by segment and region",
          "Performance attribution",
        ]}
      />
    </AppShell>
  );
}
