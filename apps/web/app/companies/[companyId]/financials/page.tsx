import type { Metadata } from "next";
import { CompanyFinancialsLive } from "@/components/company/company-financials-live";

export const metadata: Metadata = { title: "Financials" };

export default async function CompanyFinancialsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <CompanyFinancialsLive companyId={companyId} />;
}
