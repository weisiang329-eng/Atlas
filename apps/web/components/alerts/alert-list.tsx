"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import type { AlertSeverity, MockAlert } from "@/lib/mock/watchlist";

const SEVERITY_TONE: Record<AlertSeverity, "negative" | "warning" | "info"> = {
  critical: "negative",
  warning: "warning",
  info: "info",
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "严重",
  warning: "注意",
  info: "提示",
};

/**
 * Alert feed — P011 v1. Client-side filter (severity segmented) + search,
 * matching the FilterBar/DataTable conventions rather than a bespoke control.
 * Mark-read is local state here; wire to POST /v1/alerts/mark-read when the
 * backend lands (same shape, no UI change).
 */
export function AlertList({ alerts: initial }: { alerts: MockAlert[] }) {
  const [alerts, setAlerts] = useState(initial);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string>("all");

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q) || a.ticker?.toLowerCase().includes(q);
    });
  }, [alerts, query, severity]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  function markRead(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        search={query}
        onSearch={setQuery}
        placeholder="Search alerts…"
        filters={[
          { label: "全部", value: "all" },
          { label: "严重", value: "critical" },
          { label: "注意", value: "warning" },
          { label: "提示", value: "info" },
        ]}
        active={severity}
        onFilter={setSeverity}
        right={`${unreadCount} 未读 / ${alerts.length} 共`}
      />

      {filtered.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border px-6 py-14 text-center">
          <p className="font-serif text-lg text-fg">今天没有触发 — 一切平静</p>
          <p className="mt-2 text-sm text-muted">没有符合当前筛选条件的告警。</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((a) => (
            <li
              key={a.id}
              className={cn(
                "flex items-start gap-3 rounded-panel border bg-surface p-4 shadow-panel transition-colors",
                a.read ? "border-border" : "border-border-strong",
              )}
            >
              <Badge tone={SEVERITY_TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{a.title}</span>
                  {a.ticker ? <span className="font-mono text-2xs text-faint">{a.ticker}</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted">{a.detail}</p>
                <div className="mt-2 flex items-center gap-3 text-2xs text-faint">
                  <span>{formatRelative(a.firedAt)}</span>
                  {!a.read ? (
                    <button
                      type="button"
                      onClick={() => markRead(a.id)}
                      className="rounded border border-border px-2 py-0.5 text-fg transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      标记已读
                    </button>
                  ) : (
                    <span>已读</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
