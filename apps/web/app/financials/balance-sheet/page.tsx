import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { StatementTable } from "@/components/data/statement-table";
import { BALANCE_SHEET, ANNUAL_PERIODS } from "@/lib/mock/financials";

export const metadata: Metadata = { title: "Balance Sheet" };

export default function BalanceSheetPage() {
  return (
    <>
      <SectionHeading
        title="Balance sheet"
        description="Assets, liabilities and equity by period. Sample data."
      />
      <Panel className="overflow-hidden">
        <StatementTable
          periods={ANNUAL_PERIODS}
          rows={BALANCE_SHEET}
          unit="USD millions"
          caption="Balance sheet, annual, sample data"
        />
      </Panel>
    </>
  );
}
