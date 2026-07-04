"use client";

import { Badge } from "@/components/ui/badge";
import type { ReportModel } from "@/lib/mock/reports";

/**
 * Report action bar. Print uses the browser's native print (which also covers
 * print-to-PDF). PDF export, share and email are deliberately disabled — those
 * pipelines are out of scope until backend contracts exist. Hidden when printing.
 */
export function ExportToolbar({ report }: { report: ReportModel }) {
  return (
    <div className="sticky top-14 z-[5] mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg/85 py-3 backdrop-blur print:hidden">
      <div className="flex items-center gap-2 font-mono text-2xs text-faint">
        <span>{report.type}</span>
        <span aria-hidden>·</span>
        <span>{report.version}</span>
        <Badge tone="neutral">{report.status}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Print
        </button>
        <button
          type="button"
          disabled
          title="Planned — PDF export backend not built"
          className="cursor-not-allowed rounded border border-border bg-surface px-3 py-1.5 text-sm text-faint"
        >
          Export PDF
        </button>
        <button
          type="button"
          disabled
          title="Planned — sharing not built"
          className="hidden cursor-not-allowed rounded border border-border bg-surface px-3 py-1.5 text-sm text-faint sm:block"
        >
          Share
        </button>
      </div>
    </div>
  );
}
