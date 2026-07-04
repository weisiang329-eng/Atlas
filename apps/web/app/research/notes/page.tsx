import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { NotesTable } from "@/components/research/research-tables";
import { NOTES } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Research Notes" };

export default function ResearchNotesPage() {
  return (
    <>
      <SectionHeading
        title="Notes"
        description="Working research notes. Maps to the research_note data model."
        action={<Badge tone="accent">Sample</Badge>}
      />
      <Panel className="overflow-hidden">
        <NotesTable rows={NOTES} />
      </Panel>
    </>
  );
}
