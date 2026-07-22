import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { KNOWLEDGE_TABS } from "@/lib/nav";

/**
 * The shared chrome deliberately carries NO data-provenance badge.
 *
 * It used to hardcode `<Badge>Mock</Badge>` and describe the whole workspace
 * as "visualization primitives on sample data", which was wrong for two of
 * its five tabs: Overview and Graph render the real relationship graph from
 * /v1/graph/company/:id — NVIDIA's actual suppliers and competitors, sourced
 * rows, not samples. Labelling real data "Mock" is the same failure as
 * labelling a real company "Sample": it is a false statement about
 * provenance, and it trains the reader to ignore the badge on the three tabs
 * (heatmap, decision tree, memory) where it is true and matters.
 *
 * Provenance is a per-view fact, so each page states its own.
 */
export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Knowledge"
      eyebrow="Knowledge workspace"
      description="How entities relate, where exposure concentrates, and how decisions branch."
      tabs={KNOWLEDGE_TABS}
    >
      {children}
    </WorkspaceLayout>
  );
}
