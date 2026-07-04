import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <ComingSoon
        eyebrow="System"
        title="Settings"
        description="Workspace preferences and configuration."
        points={[
          "Profile and preferences",
          "Appearance (dark / light)",
          "API keys via environment only",
        ]}
      />
    </AppShell>
  );
}
