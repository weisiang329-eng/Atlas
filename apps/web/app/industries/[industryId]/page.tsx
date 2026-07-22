import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { IndustryWorkspace } from "@/components/industry/industry-workspace";
import { ALL_INDUSTRY_IDS } from "@/lib/universe";

export const metadata: Metadata = { title: "Industry" };

// Static export: EVERY node in the taxonomy, not just the seven that hold
// companies. A node missing here is a page that does not exist — and the tree
// links to all of them.
export function generateStaticParams() {
  return ALL_INDUSTRY_IDS.map((industryId) => ({ industryId }));
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ industryId: string }>;
}) {
  const { industryId } = await params;
  return (
    <AppShell title="Industry">
      <IndustryWorkspace industryId={industryId} />
    </AppShell>
  );
}
