import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { StatementTable } from "@/components/data/statement-table";
import { INCOME_STATEMENT, ANNUAL_PERIODS } from "@/lib/mock/financials";

export const metadata: Metadata = { title: "Income Statement" };

export default function IncomeStatementPage() {
  return (
    <>
      <SectionHeading
        title="Income statement"
        description="Revenue, costs and earnings by period. Sample data; totals are pre-set, not computed."
      />
      <Panel className="overflow-hidden">
        <StatementTable
          periods={ANNUAL_PERIODS}
          rows={INCOME_STATEMENT}
          unit="USD millions"
          caption="Income statement, annual, sample data"
        />
      </Panel>
    </>
  );
}
