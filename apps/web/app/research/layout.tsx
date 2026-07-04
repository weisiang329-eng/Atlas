import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TabNav } from "@/components/layout/tab-nav";
import { PageHeader } from "@/components/ui/page-header";
import { RESEARCH_TABS } from "@/lib/nav";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Research">
      <PageHeader
        eyebrow="Research"
        title="Research workspace"
        description="Evidence-first research: versioned notes and reports, an evidence log, hypotheses and a decision journal. Structure only in Milestone 1."
      />
      <TabNav items={RESEARCH_TABS} />
      <div className="pt-6">{children}</div>
    </AppShell>
  );
}
