import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Hypotheses" };

export default function ResearchHypothesesPage() {
  return (
    <>
      <SectionHeading
        title="Hypotheses"
        description="Open theses with status and confidence. Maps to research_hypothesis."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Hypothesis", "Company", "Status", "Confidence", "Updated"]}
        />
      </Panel>
    </>
  );
}
