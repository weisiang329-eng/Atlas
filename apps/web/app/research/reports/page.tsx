import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Research Reports" };

export default function ResearchReportsPage() {
  return (
    <>
      <SectionHeading
        title="Reports"
        description="Structured research reports. Maps to research_report."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Report", "Company", "Version", "Status", "Date"]}
        />
      </Panel>
    </>
  );
}
