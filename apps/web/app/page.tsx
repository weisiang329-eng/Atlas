import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { Badge } from "@/components/ui/badge";
import { DashboardGrid, Widget } from "@/components/dashboard/dashboard-grid";

const WORKSPACES = [
  {
    href: "/companies",
    title: "Companies",
    body: "Profiles, products, management, financials, valuation and documents for the coverage universe.",
    live: true,
  },
  {
    href: "/research",
    title: "Research",
    body: "Evidence-first notes, versioned reports, hypotheses and a decision journal.",
    live: true,
  },
  {
    href: "/financials",
    title: "Financials",
    body: "Statements, metrics, historical trends and quarterly / annual results.",
    live: true,
  },
];

export default function HomePage() {
  return (
    <AppShell title="Home">
      <PageHeader
        eyebrow="Decision Intelligence Platform"
        title="Company Intelligence workspace"
        description="Atlas turns market change into evidence-backed decisions. Every workspace is composed from one shared component system — structure and layout only, with clearly-labelled sample data."
      />

      <div className="mb-6">
        <StatGrid
          items={[
            { label: "Coverage", value: "06", hint: "Sample universe" },
            { label: "Research Notes", value: "—", hint: "Not wired" },
            { label: "Open Alerts", value: "—", hint: "Not wired" },
            { label: "Workspaces", value: "03", hint: "Live" },
          ]}
        />
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
                <Badge tone={w.live ? "positive" : "neutral"}>
                  {w.live ? "Live" : "Soon"}
                </Badge>
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

        <Widget span={12}>
          <Panel>
            <PanelHeader
              eyebrow="Platform"
              title="Architecture scope"
              action={<Badge tone="accent">Structure only</Badge>}
            />
            <PanelBody>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                Built as a reusable UI system: shared shell and navigation, a
                dashboard framework, typed tables, pure-SVG charts, and one async
                state model. Intentionally not built yet:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "AI chat",
                  "Portfolio & trading",
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
