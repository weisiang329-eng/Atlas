import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { Badge } from "@/components/ui/badge";
import { DashboardGrid, Widget } from "@/components/dashboard/dashboard-grid";
import { HOME_KPIS, ACTIVITY } from "@/lib/mock/activity";

const WORKSPACES = [
  {
    href: "/companies",
    title: "Companies",
    body: "Profiles, products, management, financials, valuation and documents for the coverage universe.",
  },
  {
    href: "/research",
    title: "Research",
    body: "Evidence-first notes, versioned reports, hypotheses and a decision journal.",
  },
  {
    href: "/financials",
    title: "Financials",
    body: "Statements, metrics, historical trends and quarterly / annual results.",
  },
];

export default function HomePage() {
  return (
    <AppShell title="Home">
      <PageHeader
        eyebrow="Decision Intelligence Platform"
        title="Company Intelligence workspace"
        description="Atlas turns market change into evidence-backed decisions. Every workspace is composed from one shared component system — clearly-labelled sample data throughout."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {HOME_KPIS.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <DashboardGrid>
        {WORKSPACES.map((w) => (
          <Widget key={w.href} span={4}>
            <Link
              href={w.href}
              className="group flex h-full flex-col rounded-panel border border-border bg-surface p-5 shadow-panel transition-colors hover:border-accent-dim hover:bg-surface-2"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">Workspace</span>
                <Badge tone="positive">Live</Badge>
              </div>
              <h2 className="font-serif text-lg text-fg">{w.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {w.body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-2xs uppercase tracking-wide text-accent">
                Open
                <span className="transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </span>
            </Link>
          </Widget>
        ))}

        <Widget span={8}>
          <Panel>
            <PanelHeader
              eyebrow="Feed"
              title="Recent activity"
              action={<Badge tone="accent">Sample</Badge>}
            />
            <PanelBody>
              <ActivityFeed items={ACTIVITY} />
            </PanelBody>
          </Panel>
        </Widget>

        <Widget span={4}>
          <Panel>
            <PanelHeader eyebrow="Platform" title="Not built yet" />
            <PanelBody>
              <div className="flex flex-wrap gap-2">
                {[
                  "AI chat",
                  "Portfolio",
                  "Authentication",
                  "OCR",
                  "ERP integration",
                  "Payments",
                  "Live data APIs",
                ].map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </PanelBody>
          </Panel>
        </Widget>
      </DashboardGrid>
    </AppShell>
  );
}
