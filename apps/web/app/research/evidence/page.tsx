import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EvidenceTableView } from "@/components/research/research-tables";
import { EVIDENCE } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Evidence" };

export default function ResearchEvidencePage() {
  return (
    <>
      <SectionHeading
        title="Evidence"
        description="Source-linked evidence behind every claim. Maps to research_evidence — each item carries source, url, date and confidence."
        action={<Badge tone="accent">Sample</Badge>}
      />
      <Panel className="overflow-hidden">
        <EvidenceTableView rows={EVIDENCE} />
      </Panel>
    </>
  );
}
