import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { DecisionsLive } from "@/components/research/decisions-live";

export const metadata: Metadata = { title: "Decision Journal" };

export default function DecisionJournalPage() {
  return (
    <>
      <SectionHeading
        title="Decision journal"
        description="Decisions with their rationale and conviction — review them against outcomes later. Stored locally."
      />
      <DecisionsLive />
    </>
  );
}
