import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AgentConsole } from "@/components/agents/agent-console";

export const metadata: Metadata = { title: "Agent Console" };

/**
 * Agent Console — the research department and the controls over it.
 * Spec: Atlas_Research_Platform_V1_Agent_Specification.
 */
export default function AgentsPage() {
  return (
    <AppShell title="Agents">
      <PageHeader
        eyebrowKey="page.agents.eyebrow"
        titleKey="page.agents.title"
        descriptionKey="page.agents.desc"
      />
      <AgentConsole />
    </AppShell>
  );
}
