import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DashboardGrid, Widget } from "@/components/dashboard/dashboard-grid";
import { HomeDashboard } from "@/components/home/home-dashboard";

const WORKSPACES = [
  {
    href: "/scores",
    title: "Rankings",
    body: "Atlas Score leaderboard — systematic multi-factor scores across the coverage universe.",
  },
  {
    href: "/companies",
    title: "Companies",
    body: "Profiles, financials, statements, metrics, ratios and Atlas Score for every covered company.",
  },
  {
    href: "/industries",
    title: "Industries",
    body: "Cost factors, output prices and the margin cycle signal per industry.",
  },
  {
    href: "/knowledge",
    title: "Knowledge graph",
    body: "Supplier, customer and competitor relationships across the coverage universe.",
  },
];

export default function HomePage() {
  return (
    <AppShell title="Home">
      <PageHeader
        eyebrowKey="page.home.eyebrow"
        titleKey="page.home.title"
        descriptionKey="page.home.desc"
      />

      <HomeDashboard />

      <DashboardGrid>
        {WORKSPACES.map((w) => (
          <Widget key={w.href} span={3}>
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
      </DashboardGrid>
    </AppShell>
  );
}
