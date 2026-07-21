import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlannedModule } from "@/components/ui/planned-module";

export const metadata: Metadata = { title: "Management" };

export default function CompanyManagementPage() {
  return (
    <>
      <SectionHeading
        title="Management"
        description="Leadership, tenure and ownership — the qualitative dimension the score cannot see."
      />
      <PlannedModule
        program="P005 v2"
        title="Leadership and ownership"
        body="The Atlas Score deliberately excludes management quality because it cannot be computed from filings. This module carries that dimension separately: who runs the business, how long they have, and how much of it they own."
        fields={["Name", "Role", "Since", "Prior role", "Shareholding", "Source"]}
        requires="A company_management table populated from proxy statements (DEF 14A) and annual-report governance sections."
      />
    </>
  );
}
