import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { VersionsTable } from "@/components/research/research-tables";
import { VERSIONS } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Versions" };

export default function ResearchVersionsPage() {
  return (
    <>
      <SectionHeading
        title="Versions"
        description="Full revision history so research is reproducible. Maps to research_version."
        action={<Badge tone="accent">Sample</Badge>}
      />
      <Panel className="overflow-hidden">
        <VersionsTable rows={VERSIONS} />
      </Panel>
    </>
  );
}
