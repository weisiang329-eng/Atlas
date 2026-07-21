import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AgentChat } from "@/components/agent/agent-chat";

export const metadata: Metadata = { title: "Analyst" };

export default function AgentPage() {
  return (
    <AppShell title="Analyst">
      <PageHeader
        eyebrow="AI research analyst"
        title="Ask Atlas"
        description="A Claude-powered analyst that answers from Atlas's real data — financials, scores, relationships and industry cycles. Not investment advice."
      />
      <AgentChat />
    </AppShell>
  );
}
