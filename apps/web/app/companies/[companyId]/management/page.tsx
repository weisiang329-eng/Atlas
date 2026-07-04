import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Management" };

export default function CompanyManagementPage() {
  return (
    <>
      <SectionHeading
        title="Management"
        description="Leadership, tenure and ownership. Maps to the company_management data model."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Name", "Role", "Since", "Ownership", "Notes"]}
        />
      </Panel>
    </>
  );
}
