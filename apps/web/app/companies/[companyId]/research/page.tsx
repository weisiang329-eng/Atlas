import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Research" };

export default function CompanyResearchPage() {
  return (
    <>
      <SectionHeading
        title="Research"
        description="Notes, reports and evidence attached to this company."
        action={
          <Link
            href="/research"
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-fg transition-colors hover:bg-surface-2"
          >
            Research workspace →
          </Link>
        }
      />
      <Panel>
        <PanelBody>
          <EmptyState
            title="No research yet"
            body="Company-scoped notes and reports will appear here once the research workspace is wired to a data source."
          />
        </PanelBody>
      </Panel>
    </>
  );
}
