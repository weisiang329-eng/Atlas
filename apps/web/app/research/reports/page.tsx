import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ReportsTable } from "@/components/research/research-tables";
import { REPORTS } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Research Reports" };

export default function ResearchReportsPage() {
  return (
    <>
      <SectionHeading
        title="Reports"
        description="Structured research reports. Maps to research_report."
        action={<Badge tone="accent">Sample</Badge>}
      />
      <Panel className="overflow-hidden">
        <ReportsTable rows={REPORTS} />
      </Panel>
    </>
  );
}
