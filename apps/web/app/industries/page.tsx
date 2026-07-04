import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Industries" };

export default function IndustriesPage() {
  return (
    <AppShell title="Industries">
      <ComingSoon
        eyebrow="Workspace"
        title="Industries"
        description="Industry taxonomy and supply-chain intelligence across the AI-infrastructure stack."
        points={[
          "Industry and sector taxonomy",
          "Value-chain and supplier mapping",
          "Industry-level metrics and trends",
        ]}
      />
    </AppShell>
  );
}
