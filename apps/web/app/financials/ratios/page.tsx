import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { RATIO_GROUPS } from "@/lib/mock/ratios";

export const metadata: Metadata = { title: "Ratios" };

export default function RatioDashboardPage() {
  return (
    <>
      <SectionHeading
        title="Ratio dashboard"
        description="Key ratios by category. Sample values — ratios are computed by the Ratio Engine server-side (P004), never in the UI. Valuation multiples are a separate module."
      />

      <div className="flex flex-col gap-6">
        {RATIO_GROUPS.map((group) => (
          <Panel key={group.title}>
            <PanelHeader
              eyebrow="Category"
              title={group.title}
              action={
                <span className="hidden text-xs text-muted sm:inline">
                  {group.description}
                </span>
              }
            />
            <PanelBody>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {group.ratios.map((r) => (
                  <KpiCard
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    delta={r.delta}
                    direction={r.direction}
                    series={r.series}
                  />
                ))}
              </div>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </>
  );
}
