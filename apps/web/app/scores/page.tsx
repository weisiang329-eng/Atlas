import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { RankingsLive } from "@/components/scores/rankings-live";

export const metadata: Metadata = { title: "Rankings" };

export default function ScoresPage() {
  return (
    <AppShell title="Rankings">
      <PageHeader
        eyebrowKey="page.scores.eyebrow"
        titleKey="page.scores.title"
        descriptionKey="page.scores.desc"
      />
      <RankingsLive />
    </AppShell>
  );
}
