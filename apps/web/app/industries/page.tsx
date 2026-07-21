import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { IndustriesLive } from "@/components/industry/industries-live";

export const metadata: Metadata = { title: "Industries" };

export default function IndustriesPage() {
  return (
    <AppShell title="Industries">
      <PageHeader
        eyebrow="Industry Intelligence"
        title="Industries"
        description="Sector taxonomy and supply-chain intelligence. Each industry workspace shows its cost factors, output prices and margin cycle."
      />
      <IndustriesLive />
    </AppShell>
  );
}
