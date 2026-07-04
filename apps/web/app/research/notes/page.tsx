import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Research Notes" };

export default function ResearchNotesPage() {
  return (
    <>
      <SectionHeading
        title="Notes"
        description="Working research notes. Maps to the research_note data model."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Title", "Company", "Theme", "Author", "Updated"]}
        />
      </Panel>
    </>
  );
}
