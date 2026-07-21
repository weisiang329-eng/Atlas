import type { Metadata } from "next";
import { CompanyOverviewLive } from "@/components/company/company-profile-live";

export const metadata: Metadata = { title: "Overview" };

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <CompanyOverviewLive companyId={companyId} />;
}
