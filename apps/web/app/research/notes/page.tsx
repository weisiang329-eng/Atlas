import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { NotesLive } from "@/components/research/notes-live";

export const metadata: Metadata = { title: "Research Notes" };

export default function ResearchNotesPage() {
  return (
    <>
      <SectionHeading
        title="Research notes"
        description="Working notes, optionally tagged to a company. Stored locally in your browser."
      />
      <NotesLive />
    </>
  );
}
