import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlannedModule } from "@/components/ui/planned-module";

export const metadata: Metadata = { title: "Valuation" };

export default function CompanyValuationPage() {
  return (
    <>
      <SectionHeading
        title="Valuation"
        description="Price against quality — the question the Atlas Score deliberately does not answer."
      />
      <PlannedModule
        program="P010 v2 · P027"
        title="Multiples and quality-vs-price"
        body="The Atlas Score measures business quality from reported fundamentals only, with no price input. Valuation is the other half: a 90-scoring company can still be a poor investment at the wrong price. This module adds the multiples and the quality-against-price view that completes the picture."
        fields={[
          "P / E",
          "EV / EBITDA",
          "FCF yield",
          "P / B",
          "vs. sector median",
          "Atlas Score vs. multiple",
        ]}
        requires="Market price data — a market-data API key (MARKET_DATA_KEY) under programme P027. Multiples cannot be derived from filings alone."
      />
    </>
  );
}
