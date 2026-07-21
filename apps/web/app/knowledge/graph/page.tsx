import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { GraphLive } from "@/components/knowledge/graph-live";

export const metadata: Metadata = { title: "Relationship Graph" };

export default function KnowledgeGraphPage() {
  return (
    <>
      <SectionHeading
        title="Relationship graph"
        description="Suppliers, customers and competitors for the selected company. Colour encodes relationship kind; edges are source-linked industry structure."
      />
      <GraphLive initialSubject="nvidia" />
    </>
  );
}
