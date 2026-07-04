import { ChartContainer } from "@/components/chart/chart-container";
import { RelationshipGraph } from "@/components/viz/relationship-graph";
import { Heatmap } from "@/components/viz/heatmap";
import { GRAPH_NODES, GRAPH_EDGES, HEATMAP_ROWS, HEATMAP_COLS, HEATMAP_VALUES } from "@/lib/mock/knowledge";

export default function KnowledgeOverviewPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartContainer
        title="Relationships"
        subtitle="Entity graph · sample"
        height={360}
        footer="Illustrative sample data"
      >
        <RelationshipGraph
          nodes={GRAPH_NODES}
          edges={GRAPH_EDGES}
          ariaLabel="Entity relationship graph"
        />
      </ChartContainer>
      <ChartContainer
        title="Exposure"
        subtitle="Segment × period · sample"
        footer="Illustrative sample data"
      >
        <Heatmap
          rows={HEATMAP_ROWS}
          cols={HEATMAP_COLS}
          values={HEATMAP_VALUES}
          ariaLabel="Exposure heatmap"
        />
      </ChartContainer>
    </div>
  );
}
