import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { HypothesesTable } from "@/components/research/research-tables";
import { HYPOTHESES } from "@/lib/mock/research";

export const metadata: Metadata = { title: "Hypotheses" };

export default function ResearchHypothesesPage() {
  return (
    <>
      <SectionHeading
        title="Hypotheses"
        description="Open theses with status and confidence. Maps to research_hypothesis."
        action={<Badge tone="accent">Sample</Badge>}
      />
      <Panel className="overflow-hidden">
        <HypothesesTable rows={HYPOTHESES} />
      </Panel>
    </>
  );
}
