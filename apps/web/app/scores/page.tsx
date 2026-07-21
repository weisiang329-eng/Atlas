import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { RankingsLive } from "@/components/scores/rankings-live";

export const metadata: Metadata = { title: "Rankings" };

export default function ScoresPage() {
  return (
    <AppShell title="Rankings">
      <PageHeader
        eyebrow="Atlas Score"
        title="Rankings"
        description="Systematic multi-factor score across the coverage universe, computed from reported fundamentals. Not investment advice."
      />
      <RankingsLive />
    </AppShell>
  );
}
