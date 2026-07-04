import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Evidence" };

export default function ResearchEvidencePage() {
  return (
    <>
      <SectionHeading
        title="Evidence"
        description="Source-linked evidence behind every claim. Maps to research_evidence — each item carries source, url, date and confidence."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Claim", "Source", "Type", "Confidence", "Date"]}
        />
      </Panel>
    </>
  );
}
