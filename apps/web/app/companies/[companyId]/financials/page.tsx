import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Financials" };

export default function CompanyFinancialsPage() {
  return (
    <>
      <SectionHeading
        title="Financials"
        description="Reported statements and derived metrics. Maps to financial_statement and financial_metric."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={[
            "Period",
            "Revenue",
            "Gross margin",
            "Operating margin",
            "EPS",
          ]}
        />
      </Panel>
    </>
  );
}
