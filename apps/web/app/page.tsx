import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";

const WORKSPACES = [
  {
    href: "/companies",
    eyebrow: "Workspace",
    title: "Companies",
    body: "Profiles, products, management, financials, valuation and documents for the coverage universe.",
    live: true,
  },
  {
    href: "/research",
    eyebrow: "Workspace",
    title: "Research",
    body: "Evidence-first notes, versioned reports, hypotheses and a decision journal.",
    live: true,
  },
  {
    href: "/financials",
    eyebrow: "Workspace",
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
        description="Atlas turns market change into evidence-backed decisions. Milestone 1 lays down the Company and Research workspaces — structure and layout only, with clearly-labelled sample data."
      />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-4">
        {[
          { label: "Coverage", value: "06", hint: "Sample universe" },
          { label: "Research Notes", value: "—", hint: "Not wired" },
          { label: "Open Alerts", value: "—", hint: "Not wired" },
          { label: "Milestone", value: "01", hint: "Company Intel" },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <Stat label={s.label} value={s.value} hint={s.hint} />
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {WORKSPACES.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="group rounded-panel border border-border bg-surface p-5 shadow-panel transition-colors hover:border-accent-dim hover:bg-surface-2"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">{w.eyebrow}</span>
              {w.live ? (
                <Badge tone="positive">Live</Badge>
              ) : (
                <Badge tone="neutral">Soon</Badge>
              )}
            </div>
            <h2 className="font-serif text-lg text-fg">{w.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{w.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-2xs uppercase tracking-wide text-accent">
              Open
              <span className="transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </span>
          </Link>
        ))}
      </div>

      <Panel>
        <PanelHeader
          eyebrow="Milestone 1"
          title="Foundation scope"
          action={<Badge tone="accent">Structure only</Badge>}
        />
        <PanelBody>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Built this milestone: the Company workspace (10 sections) and Research
            workspace (6 sections), full navigation, and reusable layout
            primitives. Intentionally not built:
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
    </AppShell>
  );
}
