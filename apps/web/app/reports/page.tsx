import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { REPORT_INDEX, type ReportStatus } from "@/lib/mock/reports";

export const metadata: Metadata = { title: "Reports" };

const STATUS_TONE: Record<ReportStatus, "neutral" | "warning" | "positive"> = {
  Draft: "neutral",
  "In review": "warning",
  Final: "positive",
};

export default function ReportsPage() {
  return (
    <AppShell title="Reports">
      <PageHeader
        eyebrow="Report library"
        title="Intelligence reports"
        description="Decision documents — not exports. Each answers what changed, why, who is affected, the evidence, and the decision to consider next. Sample content only."
        actions={<Badge tone="accent">Mock library</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_INDEX.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="group flex h-full flex-col rounded-panel border border-border bg-surface p-5 shadow-panel transition-colors hover:border-accent-dim hover:bg-surface-2"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="eyebrow">{r.type}</span>
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
            </div>
            <p className="text-sm font-medium text-fg">{r.subject}</p>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
              {r.summaryLine}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-2xs uppercase tracking-wide text-accent">
              Open report
              <span className="transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
