import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <AppShell title="Admin">
      <ComingSoon
        eyebrow="System"
        title="Admin"
        description="Workspace administration. Authentication and RBAC are out of scope for Milestone 1."
        points={[
          "Users and roles",
          "Access control (RBAC)",
          "Audit log",
        ]}
      />
    </AppShell>
  );
}
