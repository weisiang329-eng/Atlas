import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlannedModule } from "@/components/ui/planned-module";

export const metadata: Metadata = { title: "Timeline" };

/**
 * The timeline used to render MOCK_TIMELINE — four invented events (an
 * "Overweight" rating action, a dated product announcement) shown identically
 * on every company, real ones included. A "Sample events" badge does not make
 * that safe: convention #1 allows sample data only for FICTIONAL entities, and
 * a dated, checkable-looking event attributed to NVIDIA is a fabricated claim
 * about a real company — the same defect as the deleted news mock. Until a
 * company_event table exists, the honest state is a planned module, not a fake
 * history.
 */
export default function CompanyTimelinePage() {
  return (
    <>
      <SectionHeading
        title="Timeline"
        description="Chronological record of events, research versions and decisions. History is never deleted."
      />
      <PlannedModule
        title="Company timeline"
        body="A sourced, chronological record for this company — filings as they publish, research-note versions, and decisions from the journal — so the investment case can be read as it evolved, not only as it stands today."
        fields={["date", "category", "title", "source", "linked filing / note / decision"]}
        requires="a company_event table, populated from the filings already ingested plus the research-version and decision-journal records. Nothing here is invented — an event exists only if a source does."
        program="P008"
      />
    </>
  );
}
