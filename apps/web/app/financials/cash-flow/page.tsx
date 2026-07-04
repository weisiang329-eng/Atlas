import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { StatementTable } from "@/components/data/statement-table";
import { CASH_FLOW, ANNUAL_PERIODS } from "@/lib/mock/financials";

export const metadata: Metadata = { title: "Cash Flow" };

export default function CashFlowPage() {
  return (
    <>
      <SectionHeading
        title="Cash flow"
        description="Operating, investing and financing cash flows by period. Sample data."
      />
      <Panel className="overflow-hidden">
        <StatementTable
          periods={ANNUAL_PERIODS}
          rows={CASH_FLOW}
          unit="USD millions"
          caption="Cash flow statement, annual, sample data"
        />
      </Panel>
    </>
  );
}
