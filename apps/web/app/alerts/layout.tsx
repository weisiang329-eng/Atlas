import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function AlertsLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Alerts"
      eyebrow="P011 · Alerts"
      description="Rule-triggered alerts across price, earnings and decision-due events."
    >
      {children}
    </WorkspaceLayout>
  );
}
