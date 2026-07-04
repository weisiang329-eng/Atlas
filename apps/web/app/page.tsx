import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";

const FOUNDATION = [
  { label: "Next.js app scaffold", done: true },
  { label: "TypeScript (strict)", done: true },
  { label: "Tailwind design tokens", done: true },
  { label: "Terminal shell + navigation", done: true },
  { label: "Shared UI primitives", done: true },
  { label: "Placeholder routes", done: true },
];

export default function HomePage() {
  return (
    <AppShell title="Overview">
      <section className="mb-8">
        <p className="eyebrow mb-3">Decision Intelligence Platform</p>
        <h2 className="max-w-2xl font-serif text-3xl font-semibold leading-tight text-fg sm:text-4xl">
          An institutional research terminal for the AI-infrastructure era.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Atlas turns market change into evidence-backed decisions across
          investment, industry, ERP, M&amp;A, and board reporting. This is the
          Sprint&nbsp;000 foundation — the shell and design system only, no
          product features yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded border border-accent-dim bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:brightness-110"
          >
            Open Dashboard
          </Link>
          <Link
            href="/company"
            className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            Company Profile
          </Link>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-4">
        {[
          { label: "First Module", value: "Invest", hint: "AI infrastructure" },
          { label: "Coverage Groups", value: "09", hint: "Semis to power" },
          { label: "Platform Modules", value: "05", hint: "Invest to Board" },
          { label: "Sprint", value: "000", hint: "Foundation" },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <Stat label={s.label} value={s.value} hint={s.hint} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            eyebrow="Sprint 000"
            title="Frontend foundation"
            action={<Badge tone="positive">Ready</Badge>}
          />
          <PanelBody>
            <ul className="space-y-2.5">
              {FOUNDATION.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-sm text-muted"
                >
                  <span className="grid h-4 w-4 place-items-center rounded-full border border-positive/50 text-2xs text-positive">
                    &#10003;
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Roadmap" title="Not built yet" />
          <PanelBody>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Per the Sprint&nbsp;000 brief, these remain intentionally
              unbuilt until the foundation is accepted:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Scoring engine",
                "Company database",
                "AI agent runtime",
                "Data ingestion",
                "Authentication",
                "Watchlist & alerts",
              ].map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}
