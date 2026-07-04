import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Decision Journal" };

export default function DecisionJournalPage() {
  return (
    <>
      <SectionHeading
        title="Decision Journal"
        description="Logged decisions with context and outcome for later review. Maps to decision_journal."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Decision", "Context", "Conviction", "Outcome", "Date"]}
        />
      </Panel>
    </>
  );
}
