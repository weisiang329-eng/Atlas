import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/ui/timeline";
import { MOCK_TIMELINE } from "@/lib/mock/timeline";

export const metadata: Metadata = { title: "Timeline" };

export default function CompanyTimelinePage() {
  return (
    <>
      <SectionHeading
        title="Timeline"
        description="Chronological record of events, research versions and decisions. History is never deleted."
        action={<Badge tone="accent">Sample events</Badge>}
      />
      <Panel>
        <PanelBody>
          <Timeline events={MOCK_TIMELINE} />
        </PanelBody>
      </Panel>
    </>
  );
}
