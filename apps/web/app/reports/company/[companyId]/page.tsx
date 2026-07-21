import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyReport } from "@/components/report/company-report";
import { STATIC_UNIVERSE } from "@/lib/universe";

export const metadata: Metadata = { title: "Company Report" };

export function generateStaticParams() {
  return STATIC_UNIVERSE.map((c) => ({ companyId: c.id }));
}

export default async function CompanyReportPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return (
    <AppShell title="Company Report">
      <CompanyReport companyId={companyId} />
    </AppShell>
  );
}
