import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { MOCK_DOCUMENTS } from "@/lib/mock/documents";

export const metadata: Metadata = { title: "Documents" };

export default function CompanyDocumentsPage() {
  return (
    <>
      <SectionHeading
        title="Documents"
        description="Filings, transcripts and source documents. Maps to source_document and filing."
        action={<Badge tone="accent">Sample list</Badge>}
      />
      <DocumentViewer documents={MOCK_DOCUMENTS} />
    </>
  );
}
