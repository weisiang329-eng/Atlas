import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ReportLayout } from "@/components/report/report-layout";
import { getMockReport, REPORT_IDS } from "@/lib/mock/reports";

export function generateStaticParams() {
  return REPORT_IDS.map((reportId) => ({ reportId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportId: string }>;
}): Promise<Metadata> {
  const { reportId } = await params;
  const report = getMockReport(reportId);
  return { title: report ? report.type : "Report" };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = getMockReport(reportId);
  if (!report) notFound();

  return (
    <AppShell title="Reports">
      <Link
        href="/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg print:hidden"
      >
        <span aria-hidden>&larr;</span> All reports
      </Link>
      <ReportLayout report={report} />
    </AppShell>
  );
}
