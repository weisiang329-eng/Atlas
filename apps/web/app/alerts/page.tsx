import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <AppShell title="Alerts">
      <ComingSoon
        eyebrow="Positions"
        title="Alerts"
        description="Signal and event alerts across the coverage universe."
        points={[
          "Signal and threshold alerts",
          "Event and filing triggers",
          "Delivery rules and routing",
        ]}
      />
    </AppShell>
  );
}
