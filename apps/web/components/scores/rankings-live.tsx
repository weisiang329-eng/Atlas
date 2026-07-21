"use client";

/**
 * Atlas Score leaderboard — the coverage universe ranked by systematic factor
 * score. Live from /v1/scores; no sample fallback (a score requires real
 * financials), so without an API configured it shows guidance.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { DataTable, type Column } from "@/components/data/data-table";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type { ScoreRow } from "@/lib/types";

function tone(score: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (score === null) return "neutral";
  if (score >= 65) return "positive";
  if (score >= 40) return "warning";
  return "negative";
}

const factorCell = (v: number | null) =>
  v === null ? <span className="text-faint">—</span> : <span className="font-mono">{v}</span>;

const columns: Column<ScoreRow>[] = [
  {
    key: "atlasScore",
    header: "Score",
    numeric: true,
    sortable: true,
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        <Badge tone={tone(r.atlasScore)}>{r.atlasScore ?? "—"}</Badge>
        <span className="text-faint">{r.grade}</span>
      </span>
    ),
  },
  {
    key: "name",
    header: "Company",
    sortable: true,
    render: (r) => (
      <Link href={`/companies/${r.id}/overview`} className="text-fg hover:text-accent">
        {r.name}
      </Link>
    ),
  },
  { key: "ticker", header: "Ticker", sortable: true },
  { key: "segment", header: "Segment" },
  { key: "profitability", header: "Profit.", numeric: true, render: (r) => factorCell(r.factors.profitability ?? null) },
  { key: "growth", header: "Growth", numeric: true, render: (r) => factorCell(r.factors.growth ?? null) },
  { key: "strength", header: "Strength", numeric: true, render: (r) => factorCell(r.factors.strength ?? null) },
  { key: "cash", header: "Cash", numeric: true, render: (r) => factorCell(r.factors.cash ?? null) },
  { key: "asOf", header: "As of" },
];

export function RankingsLive() {
  const live = isApiConfigured();
  const r = useApiResource<ScoreRow[]>(live ? "/v1/scores" : null);

  if (!live) {
    return (
      <EmptyState
        title="API not configured"
        body="Set NEXT_PUBLIC_API_BASE_URL at build time to load the Atlas Score leaderboard."
      />
    );
  }

  return (
    <DataState status={r.status}>
      <Panel className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={r.data ?? []}
          getRowId={(row) => row.id}
          searchable
          searchPlaceholder="Search companies"
          caption="Atlas Score leaderboard"
        />
      </Panel>
    </DataState>
  );
}
