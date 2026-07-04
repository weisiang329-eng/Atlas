import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AppearanceControls } from "@/components/settings/appearance-controls";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Workspace preferences. Appearance is live; the rest await backend and auth."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            eyebrow="Preferences"
            title="Appearance"
            action={<Badge tone="positive">Live</Badge>}
          />
          <PanelBody>
            <AppearanceControls />
            <p className="mt-4 text-2xs text-faint">
              Saved to this browser. Dark mode stays first-class; density adjusts
              table rhythm.
            </p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Account" title="Profile & security" />
          <PanelBody>
            <EmptyState
              title="Awaiting authentication"
              body="Profile, API keys and security settings arrive with the auth backend. Keys will be environment-only."
            />
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}
