import Link from "next/link";
import { StatGrid } from "@/components/ui/stat-grid";
import { RESEARCH_TABS } from "@/lib/nav";
import { NOTES, REPORTS, EVIDENCE, HYPOTHESES } from "@/lib/mock/research";

const OPEN_HYPOTHESES = HYPOTHESES.filter((h) => h.status === "Open").length;

const DESCRIPTIONS: Record<string, string> = {
  Notes: "Working research notes tagged by company and theme.",
  Reports: "Structured, versioned research reports.",
  Evidence: "Source-linked evidence log behind every claim.",
  Versions: "Full revision history — research is reproducible.",
  Hypotheses: "Open theses with confidence and status.",
  "Decision Journal": "Logged decisions, context and outcomes.",
};

const CARDS = RESEARCH_TABS.filter((t) => t.href !== "/research").map((t) => ({
  ...t,
  body: DESCRIPTIONS[t.label] ?? "",
}));

export default function ResearchOverviewPage() {
  return (
    <>
      <div className="mb-6">
        <StatGrid
          items={[
            { label: "Notes", value: String(NOTES.length), hint: "Sample" },
            { label: "Reports", value: String(REPORTS.length), hint: "Sample" },
            { label: "Open Hypotheses", value: String(OPEN_HYPOTHESES), hint: "Sample" },
            { label: "Evidence Items", value: String(EVIDENCE.length), hint: "Sample" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-panel border border-border bg-surface p-5 shadow-panel transition-colors hover:border-accent-dim hover:bg-surface-2"
          >
            <h2 className="font-serif text-base text-fg">{card.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-2xs uppercase tracking-wide text-accent">
              Open
              <span className="transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
