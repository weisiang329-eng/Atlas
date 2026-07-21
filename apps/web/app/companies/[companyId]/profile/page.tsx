import type { Metadata } from "next";
import { CompanyProfileLive } from "@/components/company/company-profile-live";

export const metadata: Metadata = { title: "Profile" };

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <CompanyProfileLive companyId={companyId} />;
}
