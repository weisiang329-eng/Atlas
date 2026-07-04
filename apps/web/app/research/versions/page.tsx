import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Versions" };

export default function ResearchVersionsPage() {
  return (
    <>
      <SectionHeading
        title="Versions"
        description="Full revision history so research is reproducible. Maps to research_version."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Version", "Report", "Author", "Change", "Date"]}
        />
      </Panel>
    </>
  );
}
