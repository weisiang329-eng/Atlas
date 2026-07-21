import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { IndustryWorkspace } from "@/components/industry/industry-workspace";
import { STATIC_INDUSTRIES } from "@/lib/universe";

export const metadata: Metadata = { title: "Industry" };

// Static export: pre-render every industry in the taxonomy snapshot.
export function generateStaticParams() {
  return STATIC_INDUSTRIES.map((i) => ({ industryId: i.id }));
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
