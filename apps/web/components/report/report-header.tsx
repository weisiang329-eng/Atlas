"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge, ConfidenceBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/lib/i18n/use-locale";
import type { ReportModel } from "@/lib/mock/reports";

/** Document masthead: type, title, subject and the report's meta chips. */
export function ReportHeader({ report }: { report: ReportModel }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  return (
    <header className="pb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{report.type}</p>
          <h1 className="font-serif text-2xl font-semibold text-fg sm:text-3xl">
            {report.title}
          </h1>
          <p className="mt-1 text-sm text-muted">{report.subject}</p>
        </div>
        <Badge tone="accent">{zh ? "模拟报告" : "Mock report"}</Badge>
      </div>

      <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-2xs">
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-faint">{zh ? "作者" : "Author"}</dt>
          <dd className="text-muted">{report.author}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-faint">{zh ? "日期" : "Date"}</dt>
          <dd className="font-mono text-muted">{report.date}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-faint">{zh ? "版本" : "Version"}</dt>
          <dd className="font-mono text-muted">{report.version}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-faint">{zh ? "状态" : "Status"}</dt>
          <dd>
            <StatusBadge status={report.status} />
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-faint">{zh ? "置信度" : "Confidence"}</dt>
          <dd>
            <ConfidenceBadge level={report.confidence} />
          </dd>
        </div>
      </dl>
    </header>
  );
}
