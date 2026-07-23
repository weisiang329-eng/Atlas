import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlannedModule } from "@/components/ui/planned-module";

export const metadata: Metadata = { title: "Documents" };

/**
 * Documents used to render MOCK_DOCUMENTS — a fixed list ("Annual report FY24",
 * "Q4 FY24 earnings call transcript", a "Supply agreement summary") with dates
 * and page counts, shown identically for every company. None of those filings
 * exists in storage, and the same list under NVIDIA and under Vertiv reads as a
 * real filing index for each. Convention #1: no fabricated table for a real
 * company. Until filings are stored, this is a planned module.
 */
export default function CompanyDocumentsPage() {
  return (
    <>
      <SectionHeading
        title="Documents"
        description="Filings, transcripts and source documents. Maps to source_document and filing."
      />
      <PlannedModule
        title="Documents"
        body="The company's own source documents — annual and quarterly filings, earnings-call transcripts, investor decks — each viewable and linkable, so a claim on any other page can be traced back to the page it came from."
        fields={["title", "type", "date", "source", "pages", "link"]}
        requires="the filings stored in R2 plus a source_document / filing table indexing them. The SEC EDGAR filing feed is already probe-verified reachable from the Worker; it is not yet wired to a route."
        program="P005 v2"
      />
    </>
  );
}
