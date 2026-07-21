import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ValueChainLive } from "@/components/industry/value-chain-live";

export const metadata: Metadata = { title: "Value Chain" };

export default function ValueChainPage() {
  return (
    <AppShell title="Value Chain">
      <PageHeader
        eyebrow="Industry Intelligence"
        title="AI hardware value chain"
        description="How the AI-infrastructure stack fits together — equipment to foundry to memory to accelerators to networking to power — with the real supply links between covered companies."
      />
      <ValueChainLive />
    </AppShell>
  );
}
