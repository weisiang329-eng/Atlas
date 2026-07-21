"use client";

/**
 * Watchlist workspace (P011) — the companies the user follows, joined against
 * the live Atlas Score leaderboard for at-a-glance quality. Empty until the
 * user stars companies (the ☆ on any company header).
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { DataTable, type Column } from "@/components/data/data-table";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { useWatchlist } from "@/lib/loaders/use-watchlist";
import { getStaticCompany } from "@/lib/universe";
import type { ScoreRow } from "@/lib/types";

function tone(s: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (s === null) return "neutral";
  if (s >= 65) return "positive";
  if (s >= 40) return "warning";
  return "negative";
}

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
  { key: "country", header: "Country" },
  { key: "asOf", header: "As of" },
];

export function WatchlistLive() {
  const { ids } = useWatchlist();
  const live = isApiConfigured();
  const r = useApiResource<ScoreRow[]>(live ? "/v1/scores" : null);

  if (ids.length === 0) {
    return (
      <EmptyState
        title="Your watchlist is empty"
        body="Open any company and tap ☆ Watchlist to follow it. Followed companies appear here with their Atlas Score."
      />
    );
  }

  // Rows for followed ids. Prefer live score rows; fall back to identity-only
  // rows (score —) for followed companies not present in the leaderboard.
  const scoreById = new Map((r.data ?? []).map((row) => [row.id, row]));
  const rows: ScoreRow[] = ids.map((id) => {
    const hit = scoreById.get(id);
    if (hit) return hit;
    const stub = getStaticCompany(id);
    return {
      id,
      name: stub?.name ?? id,
      ticker: stub?.ticker ?? "—",
      segment: stub?.segment ?? "—",
      country: stub?.country ?? "—",
      atlasScore: null,
      grade: "—",
      asOf: null,
      factors: {},
    };
  });
  rows.sort((a, b) => (b.atlasScore ?? -1) - (a.atlasScore ?? -1));

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Badge tone="accent">Watching</Badge>
        <span className="text-xs text-muted">{ids.length} companies</span>
      </div>
      <DataState status={live ? r.status : "ready"}>
        <Panel className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            caption="Watchlist"
          />
        </Panel>
      </DataState>
    </>
  );
}
