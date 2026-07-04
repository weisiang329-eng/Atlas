import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { DecisionsTable } from "@/components/research/research-tables";
import { DECISIONS } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Decision Journal" };

export default function DecisionJournalPage() {
  return (
    <>
      <SectionHeading
        title="Decision Journal"
        description="Logged decisions with context and outcome for later review. Maps to decision_journal."
        action={<Badge tone="accent">Sample</Badge>}
      />
      <Panel className="overflow-hidden">
        <DecisionsTable rows={DECISIONS} />
      </Panel>
    </>
  );
}
