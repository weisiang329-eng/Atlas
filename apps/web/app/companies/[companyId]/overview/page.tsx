import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { getMockCompany } from "@/lib/mock/companies";

export const metadata: Metadata = { title: "Overview" };

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = getMockCompany(companyId);

  const facts: { label: string; value: string }[] = [
    { label: "Segment", value: company?.segment ?? "—" },
    { label: "Exchange", value: company?.exchange ?? "—" },
    { label: "Ticker", value: company?.ticker ?? "—" },
    { label: "Country", value: company?.country ?? "—" },
    { label: "Founded", value: "—" },
    { label: "Employees", value: "—" },
  ];

  return (
    <>
      <SectionHeading
        title="Overview"
        description="Snapshot of the investment case. Scores, price and estimates are placeholders until a data contract is wired."
      />

      <div className="mb-6">
        <StatGrid
          items={[
            { label: "Atlas Score", value: "—" },
            { label: "Conviction", value: "—" },
            { label: "Market Cap", value: "—" },
            { label: "Upside", value: "—" },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader eyebrow="Thesis" title="Research summary" />
          <PanelBody>
            <EmptyState
              title="No thesis yet"
              body="Evidence-first research — facts, assumptions, inferences, risks and open questions — will render here with source metadata for every claim."
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Reference" title="Key facts" />
          <PanelBody className="p-0">
            <dl className="divide-y divide-border">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <dt className="text-sm text-muted">{f.label}</dt>
                  <dd className="font-mono text-sm text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
