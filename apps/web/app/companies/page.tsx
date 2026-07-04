import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { MOCK_COMPANIES } from "@/lib/mock/companies";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <AppShell title="Companies">
      <PageHeader
        eyebrow="Company Intelligence"
        title="Companies"
        description="The coverage universe. Rows below are a labelled sample; profiles, scores and financials populate once a backend contract is wired."
        actions={
          <span className="inline-flex cursor-not-allowed items-center rounded border border-border bg-surface px-3 py-2 text-sm text-faint">
            + Add company
          </span>
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <Badge tone="accent">Sample universe</Badge>
        <span className="text-xs text-muted">
          {MOCK_COMPANIES.length} companies · mock data
        </span>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Company", "Ticker", "Exchange", "Segment", "Atlas Score"].map(
                  (col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3 font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {MOCK_COMPANIES.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-surface-2"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${company.id}/overview`}
                      className="font-medium text-fg hover:text-accent"
                    >
                      {company.name}
                    </Link>
                    <p className="text-2xs text-faint">{company.country}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {company.ticker}
                  </td>
                  <td className="px-4 py-3 text-muted">{company.exchange}</td>
                  <td className="px-4 py-3 text-muted">{company.segment}</td>
                  <td className="px-4 py-3 font-mono text-faint">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
