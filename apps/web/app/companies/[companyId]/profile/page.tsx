import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { getMockCompany } from "@/lib/mock/companies";

export const metadata: Metadata = { title: "Profile" };

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = getMockCompany(companyId);

  const rows: { label: string; value: string }[] = [
    { label: "Legal name", value: company?.name ?? "—" },
    { label: "Ticker", value: company?.ticker ?? "—" },
    { label: "Exchange", value: company?.exchange ?? "—" },
    { label: "Primary segment", value: company?.segment ?? "—" },
    { label: "Country", value: company?.country ?? "—" },
    { label: "Founded", value: "—" },
    { label: "Headquarters", value: "—" },
    { label: "Employees", value: "—" },
    { label: "Website", value: "—" },
    { label: "Fiscal year end", value: "—" },
  ];

  return (
    <>
      <SectionHeading
        title="Profile"
        description="Company identity and reference attributes. Identifiers are from the sample universe; the rest await a data source."
      />
      <Panel>
        <PanelBody className="p-0">
          <dl className="grid grid-cols-1 sm:grid-cols-2">
            {rows.map((r, i) => (
              <div
                key={r.label}
                className={`flex items-center justify-between gap-4 border-border px-5 py-3 ${
                  i % 2 === 0 ? "sm:border-r" : ""
                } border-b`}
              >
                <dt className="text-sm text-muted">{r.label}</dt>
                <dd className="truncate text-right font-mono text-sm text-fg">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </PanelBody>
      </Panel>
    </>
  );
}
