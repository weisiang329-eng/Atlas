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
import { useLocale } from "@/lib/i18n/use-locale";
import type { ScoreRow } from "@/lib/types";

function tone(s: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (s === null) return "neutral";
  if (s >= 65) return "positive";
  if (s >= 40) return "warning";
  return "negative";
}

export function WatchlistLive() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { ids } = useWatchlist();
  const live = isApiConfigured();
  const r = useApiResource<ScoreRow[]>(live ? "/v1/scores" : null);

  const columns: Column<ScoreRow>[] = [
    {
      key: "atlasScore",
      header: zh ? "评分" : "Score",
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
      header: zh ? "公司" : "Company",
      sortable: true,
      render: (r) => (
        <Link href={`/companies/${r.id}/overview`} className="text-fg hover:text-accent">
          {r.name}
        </Link>
      ),
    },
    { key: "ticker", header: zh ? "代码" : "Ticker", sortable: true },
    { key: "segment", header: zh ? "板块" : "Segment" },
    { key: "country", header: zh ? "国家/地区" : "Country" },
    { key: "asOf", header: zh ? "截至" : "As of" },
  ];

  if (ids.length === 0) {
    return (
      <EmptyState
        title={zh ? "自选股为空" : "Your watchlist is empty"}
        body={zh ? "打开任意公司并点击 ☆ 自选即可关注。关注的公司会连同其 Atlas 评分显示在这里。" : "Open any company and tap ☆ Watchlist to follow it. Followed companies appear here with their Atlas Score."}
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
        <Badge tone="accent">{zh ? "关注中" : "Watching"}</Badge>
        <span className="text-xs text-muted">{zh ? `${ids.length} 家公司` : `${ids.length} companies`}</span>
      </div>
      <DataState status={live ? r.status : "ready"}>
        <Panel className="overflow-hidden">
          <DataTable
        mobileCards
        columnPickerId="watchlist"
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            caption={zh ? "自选股" : "Watchlist"}
          />
        </Panel>
      </DataState>
    </>
  );
}
