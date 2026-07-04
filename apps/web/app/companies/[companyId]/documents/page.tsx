import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Documents" };

export default function CompanyDocumentsPage() {
  return (
    <>
      <SectionHeading
        title="Documents"
        description="Filings, transcripts and source documents. Maps to source_document and filing."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Document", "Type", "Source", "Date", "Confidence"]}
        />
      </Panel>
    </>
  );
}
