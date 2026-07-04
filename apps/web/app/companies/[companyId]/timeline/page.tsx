import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Timeline" };

export default function CompanyTimelinePage() {
  return (
    <>
      <SectionHeading
        title="Timeline"
        description="Chronological record of events, research versions and decisions for this company."
      />
      <Panel>
        <PanelBody>
          <EmptyState
            title="No events yet"
            body="News, filings, rating changes and decision-journal entries will stream into a single audit-friendly timeline. History is never deleted."
          />
        </PanelBody>
      </Panel>
    </>
  );
}
