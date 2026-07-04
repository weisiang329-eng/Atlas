import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { Badge } from "@/components/ui/badge";
import { KNOWLEDGE_TABS } from "@/lib/nav";

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Knowledge"
      eyebrow="Knowledge workspace"
      description="How entities relate, where exposure concentrates, and how decisions branch. Visualization primitives on sample data."
      tabs={KNOWLEDGE_TABS}
      actions={<Badge tone="accent">Mock</Badge>}
    >
      {children}
    </WorkspaceLayout>
  );
}
