import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { PlaceholderTable } from "@/components/ui/placeholder-table";

export const metadata: Metadata = { title: "Products" };

export default function CompanyProductsPage() {
  return (
    <>
      <SectionHeading
        title="Products"
        description="Product and segment breakdown. Maps to the company_product data model."
      />
      <Panel className="overflow-hidden">
        <PlaceholderTable
          columns={["Product", "Segment", "Stage", "Revenue share", "Notes"]}
        />
      </Panel>
    </>
  );
}
