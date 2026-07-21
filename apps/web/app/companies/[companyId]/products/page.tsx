import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlannedModule } from "@/components/ui/planned-module";

export const metadata: Metadata = { title: "Products" };

export default function CompanyProductsPage() {
  return (
    <>
      <SectionHeading
        title="Products"
        description="Product and segment breakdown — where revenue actually comes from."
      />
      <PlannedModule
        program="P005 v2"
        title="Segment and product mix"
        body="Revenue concentration by product line is the clearest read on how exposed a company is to a single cycle. This module will break reported revenue down by segment and product, and track how that mix shifts over time."
        fields={[
          "Product",
          "Segment",
          "Value-chain stage",
          "Revenue share",
          "YoY change",
          "Source",
        ]}
        requires="A company_product table plus sourced segment disclosures from filings (10-K/annual-report segment notes). Not all issuers report at this granularity."
      />
    </>
  );
}
