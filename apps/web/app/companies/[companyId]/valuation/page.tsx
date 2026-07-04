import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Valuation" };

export default function CompanyValuationPage() {
  return (
    <>
      <SectionHeading
        title="Valuation"
        description="Multiples and model output. Maps to valuation_metric and the scoring engine (planned)."
      />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border lg:grid-cols-4">
        {[
          { label: "P / E", value: "—" },
          { label: "EV / EBITDA", value: "—" },
          { label: "Fair value", value: "—" },
          { label: "Upside", value: "—" },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <Stat label={s.label} value={s.value} />
          </div>
        ))}
      </div>

      <Panel>
        <PanelHeader eyebrow="Model" title="Valuation model" />
        <PanelBody>
          <EmptyState
            title="No model yet"
            body="Versioned valuation methods and assumptions will render here. Scoring and valuation logic stays server-side, never in the UI."
          />
        </PanelBody>
      </Panel>
    </>
  );
}
