import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TabNav } from "@/components/layout/tab-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { KNOWLEDGE_TABS } from "@/lib/nav";

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Knowledge">
      <PageHeader
        eyebrow="Knowledge workspace"
        title="Knowledge"
        description="How entities relate, where exposure concentrates, and how decisions branch. Visualization primitives on sample data."
        actions={<Badge tone="accent">Mock</Badge>}
      />
      <TabNav items={KNOWLEDGE_TABS} />
      <div className="pt-6">{children}</div>
    </AppShell>
  );
}
