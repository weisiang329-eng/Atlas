import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { DecisionTree } from "@/components/viz/decision-tree";
import { DECISION_TREE } from "@/lib/mock/knowledge";

export const metadata: Metadata = { title: "Decision Tree" };

export default function KnowledgeDecisionTreePage() {
  return (
    <>
      <SectionHeading
        title="Decision tree"
        description="How a decision branches into options and outcomes. Sample structure."
      />
      <Panel>
        <PanelBody>
          <DecisionTree
            root={DECISION_TREE}
            ariaLabel="Decision tree of options and outcomes"
          />
        </PanelBody>
      </Panel>
    </>
  );
}
