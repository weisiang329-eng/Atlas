import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Heatmap } from "@/components/viz/heatmap";
import { HEATMAP_ROWS, HEATMAP_COLS, HEATMAP_VALUES } from "@/lib/mock/knowledge";

export const metadata: Metadata = { title: "Heatmap" };

export default function KnowledgeHeatmapPage() {
  return (
    <>
      <SectionHeading
        title="Exposure heatmap"
        description="Intensity by segment and period. Green → amber → red encodes rising exposure. Sample data."
      />
      <Panel>
        <PanelBody>
          <Heatmap
            rows={HEATMAP_ROWS}
            cols={HEATMAP_COLS}
            values={HEATMAP_VALUES}
            ariaLabel="Exposure heatmap by segment and period"
          />
        </PanelBody>
      </Panel>
    </>
  );
}
