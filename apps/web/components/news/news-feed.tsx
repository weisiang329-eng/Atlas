"use client";

/**
 * The news feed, on real rows.
 *
 * This page used to render `lib/mock/news` — six invented headlines, one of
 * them attributed to MARGMA (a real trade association) with a specific claim
 * about glove ASP. A real source name plus a checkable number reads as true
 * whatever badge sits beside it, which is the same defect as a fabricated
 * citation and is exactly what convention #1 forbids. The mock is deleted.
 *
 * What replaced it is deliberately smaller. The feed gives a title, a link, a
 * timestamp and whatever the tagger could match — so that is what renders.
 * There is no priority score, no category and no country here, because nothing
 * computes them: those were mock columns, and stamping "URGENT" on a real
 * headline is a claim Atlas cannot support. When a classifier exists with a
 * stated method, they come back.
 *
 * The default view is items tagged to a company we cover. Most of what a
 * ticker feed returns is general market commentary naming nobody in the
 * universe (30 of 100 in production), and that ratio is shown rather than
 * hidden, with a switch to see everything.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { useLocale } from "@/lib/i18n/use-locale";
import { fmtRelative, fmtDateTime } from "@/lib/format";
import type {
  NewsCompanyRef,
  NewsFeed as NewsFeedPayload,
  NewsFeedItem,
} from "@/lib/types";

/**
 * A ticker only works as a label when it reads as one. SK hynix trades as
 * `000660` on the KRX, and a chip saying "000660" tells the reader nothing —
 * so numeric tickers fall back to the company name.
 */
const chipLabel = (c: NewsCompanyRef): string =>
  c.ticker && /^[A-Za-z]/.test(c.ticker) ? c.ticker : c.name;

const matches = (item: NewsFeedItem, q: string): boolean => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    item.title.toLowerCase().includes(needle) ||
    item.source.toLowerCase().includes(needle) ||
    (item.query ?? "").toLowerCase().includes(needle) ||
    item.companies.some(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.ticker ?? "").toLowerCase().includes(needle),
    )
  );
};

export function NewsFeed() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"tagged" | "all">("tagged");
  const [company, setCompany] = useState("all");

  const r = useApiResource<NewsFeedPayload>("/v1/news?limit=200");
  const all = useMemo(() => r.data?.items ?? [], [r.data]);

  // Companies that actually appear in the feed — a filter offering a company
  // with nothing behind it is a dead end.
  const companies = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of all) {
      for (const c of item.companies) seen.set(c.id, chipLabel(c));
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);

  const filtered = useMemo(
    () =>
      all.filter((item) => {
        if (scope === "tagged" && item.companies.length === 0) return false;
        if (company !== "all" && !item.companies.some((c) => c.id === company))
          return false;
        return matches(item, query);
      }),
    [all, scope, company, query],
  );

  return (
    <DataState status={r.status}>
      <div className="flex flex-col gap-4">
        {/* Freshness is part of the data. Nothing schedules the pull yet, so a
            feed with no timestamp on screen would quietly read as live. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-panel border border-border bg-surface px-4 py-3 text-2xs text-muted">
          <span>
            {zh ? "最后抓取" : "Last pulled"}{" "}
            <span className="num text-fg">
              {r.data?.lastFetchedAt ? fmtDateTime(r.data.lastFetchedAt) : "—"}
            </span>
          </span>
          <span>
            {zh ? "已标记覆盖标的" : "Tagged to coverage"}{" "}
            <span className="num text-fg">
              {r.data?.tagged ?? 0}/{r.data?.total ?? 0}
            </span>
          </span>
          <span className="text-faint">
            {zh
              ? "来源：Yahoo Finance RSS（按代码抓取）· 只有标题与链接，不作为数据来源"
              : "Source: Yahoo Finance RSS (per ticker) · headlines and links only, never a source of record"}
          </span>
        </div>

        <FilterBar
          search={query}
          onSearch={setQuery}
          placeholder={
            zh ? "搜索标题、来源、代码…" : "Search headlines, sources, tickers…"
          }
          filters={[
            { label: zh ? "覆盖标的" : "Covered", value: "tagged" },
            { label: zh ? "全部" : "All", value: "all" },
          ]}
          active={scope}
          onFilter={(v) => setScope(v === "all" ? "all" : "tagged")}
          right={`${filtered.length} ${zh ? "条" : "items"}`}
        />

        {companies.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {[
              ["all", zh ? "全部公司" : "All companies"] as [string, string],
              ...companies,
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCompany(id)}
                className={`rounded-pill border px-2.5 py-1 font-mono text-2xs uppercase tracking-wide transition-colors ${
                  company === id
                    ? "border-accent-dim bg-surface-2 text-fg"
                    : "border-border text-faint hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="rounded-panel border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
            {zh ? "没有符合条件的新闻。" : "No headlines match this filter."}
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {filtered.map((n) => (
            <li
              key={n.id}
              className="rounded-panel border border-border bg-surface p-4 shadow-panel"
            >
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm font-medium text-fg hover:text-accent"
              >
                {n.title}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-faint">
                {/* Every entity mention is a link — that is what makes the
                    knowledge graph walkable rather than merely stored. */}
                {n.companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.id}/overview`}
                    className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-fg hover:text-accent"
                  >
                    {chipLabel(c)}
                  </Link>
                ))}
                {/* The query is where the item came from, not what it is
                    about — labelled as provenance so it cannot be read as a
                    tag the matcher never made. */}
                {n.companies.length === 0 && n.query ? (
                  <Badge tone="neutral">
                    {zh ? `来自 ${n.query} 源` : `from the ${n.query} feed`}
                  </Badge>
                ) : null}
                <span
                  className="ml-auto"
                  title={
                    n.sourceDerived
                      ? zh
                        ? "源站未提供发布方，这里显示的是链接域名"
                        : "The feed named no publisher; this is the link's host"
                      : undefined
                  }
                >
                  {n.source} · {fmtRelative(n.publishedAt, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DataState>
  );
}
