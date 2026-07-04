import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { RESEARCH_TABS } from "@/lib/nav";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Research"
      eyebrow="Research"
      heading="Research workspace"
      description="Evidence-first research: versioned notes and reports, an evidence log, hypotheses and a decision journal. Structure only in Milestone 1."
      tabs={RESEARCH_TABS}
    >
      {children}
    </WorkspaceLayout>
  );
}
