import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { KnowledgeGraph } from "@/components/viz/knowledge-graph";
import { GRAPH_NODES, GRAPH_EDGES } from "@/lib/mock/knowledge";

export const metadata: Metadata = { title: "Relationship Graph" };

export default function KnowledgeGraphPage() {
  return (
    <>
      <SectionHeading
        title="Relationship graph"
        description="Suppliers, customers, competitors and sector for the subject entity. Colour encodes entity kind."
      />
      <Panel>
        <PanelBody>
          <KnowledgeGraph
            nodes={GRAPH_NODES}
            edges={GRAPH_EDGES}
            ariaLabel="Knowledge graph of entity relationships"
          />
        </PanelBody>
      </Panel>
    </>
  );
}
