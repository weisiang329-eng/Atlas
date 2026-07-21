import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { GraphLive } from "@/components/knowledge/graph-live";

export const metadata: Metadata = { title: "Relations" };

export default async function CompanyRelationsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return (
    <>
      <SectionHeading
        title="Relations"
        description="This company's suppliers, customers and competitors — source-linked industry structure."
      />
      <GraphLive initialSubject={companyId} lockSubject />
    </>
  );
}
