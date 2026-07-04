import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Research terminal</p>
          <h2 className="font-serif text-2xl font-semibold text-fg">
            Workspace
          </h2>
        </div>
        <Badge tone="accent">Placeholder layout</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Watched", value: "—" },
          { label: "Alerts", value: "—" },
          { label: "Reports", value: "—" },
          { label: "Signals", value: "—" },
        ].map((s) => (
          <Panel key={s.label}>
            <PanelBody>
              <Stat label={s.label} value={s.value} hint="No data in Sprint 000" />
            </PanelBody>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader eyebrow="Coverage" title="Watchlist" />
          <PanelBody>
            <EmptyState
              title="No watchlist yet"
              body="The company watchlist, scoring columns, and live signals will land after the foundation is accepted."
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Feed" title="Intelligence" />
          <PanelBody>
            <EmptyState
              title="No signals"
              body="News, filings, and transcript signals attach here once ingestion ships."
            />
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}
