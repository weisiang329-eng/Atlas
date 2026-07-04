import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <AppShell title="Company">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-panel border border-border bg-surface-2 font-mono text-lg font-semibold text-faint">
            CO
          </span>
          <div>
            <p className="eyebrow mb-1">Company profile</p>
            <h2 className="font-serif text-2xl font-semibold text-fg">
              Untitled Company
            </h2>
            <p className="mt-1 text-sm text-muted">
              Profile scaffold — fields populate once the company database ships.
            </p>
          </div>
        </div>
        <Badge tone="neutral">Draft</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-4">
        {[
          { label: "Ticker", value: "—" },
          { label: "Sector", value: "—" },
          { label: "Atlas Score", value: "—" },
          { label: "Conviction", value: "—" },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <Stat label={s.label} value={s.value} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader eyebrow="Thesis" title="Research summary" />
          <PanelBody>
            <EmptyState
              title="No research yet"
              body="Evidence-first research notes — facts, assumptions, inferences, and risks — will render here with source metadata."
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Model" title="Scoring" />
          <PanelBody>
            <EmptyState
              title="Not scored"
              body="Versioned scoring factors attach here once the scoring engine ships."
            />
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}
