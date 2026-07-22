"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/ui/filter-bar";
import { DetailPanelLayout } from "@/components/layout/detail-panel-layout";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/ui/stat-grid";
import { PlannedModule } from "@/components/ui/planned-module";
import { RankedBars } from "@/components/chart/ranked-bars";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { MISSING } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CompanySummary, ScoreRow } from "@/lib/types";

/** Factor keys in methodology weight order — same order as /scores. */
const FACTOR_KEYS = [
  { key: "profitability", label: "Profitability" },
  { key: "growth", label: "Growth" },
  { key: "strength", label: "Strength" },
  { key: "cash", label: "Cash" },
] as const;

/** Shared with the leaderboard so a grade never changes colour between pages. */
function toneOfScore(
  score: number | null,
): "positive" | "warning" | "negative" | "neutral" {
  if (score === null) return "neutral";
  if (score >= 65) return "positive";
  if (score >= 40) return "warning";
  return "negative";
}

/**
 * Master–detail company browser: FilterBar + DetailPanelLayout. The list filters
 * live; selecting a company shows an instant preview with a link to the full
 * profile. Composes the layout and interaction frameworks — the pattern future
 * entity workspaces (suppliers, targets, holdings) reuse.
 */
export function CompaniesBrowser({ companies }: { companies: CompanySummary[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(companies[0]?.id ?? "");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      `${c.name} ${c.ticker} ${c.segment} ${c.country}`
        .toLowerCase()
        .includes(q),
    );
  }, [companies, query]);

  const selected = companies.find((c) => c.id === selectedId) ?? null;

  /*
   * One fetch for the whole leaderboard rather than one per selection: the
   * universe is tens of companies, the response is already cached by the
   * loader, and switching companies in the list then costs nothing.
   */
  const scores = useApiResource<ScoreRow[]>(
    isApiConfigured() ? "/v1/scores" : null,
  );
  const scoreById = useMemo(
    () => new Map((scores.data ?? []).map((s) => [s.id, s])),
    [scores.data],
  );

  return (
    <>
      <FilterBar
        search={query}
        onSearch={setQuery}
        placeholder="Search companies"
        right={`${visible.length} / ${companies.length}`}
      />

      <DetailPanelLayout
        leftWidth="md"
        list={
          <ul
            className="flex max-h-[32rem] flex-col overflow-y-auto rounded-panel border border-border bg-surface"
            aria-label="Companies"
          >
            {visible.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted">
                No companies match “{query}”.
              </li>
            ) : (
              visible.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id} className="border-b border-border last:border-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
                        active ? "bg-surface-2" : "hover:bg-surface-2/60",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">
                          {c.name}
                        </span>
                        <span className="font-mono text-2xs text-faint">
                          {c.segment}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-2xs text-muted">
                        {c.ticker}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        }
        detail={
          selected ? (
            <CompanyPreview
              company={selected}
              score={scoreById.get(selected.id) ?? null}
            />
          ) : null
        }
      />
    </>
  );
}

function CompanyPreview({
  company,
  score,
}: {
  company: CompanySummary;
  score: ScoreRow | null;
}) {
  const monogram = company.ticker.slice(0, 2).toUpperCase();
  const facts: { label: string; value: string }[] = [
    { label: "Ticker", value: company.ticker },
    { label: "Exchange", value: company.exchange },
    { label: "Segment", value: company.segment },
    { label: "Country", value: company.country },
  ];

  return (
    <div className="rounded-panel border border-border bg-surface shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-panel border border-border bg-surface-2 font-mono text-base font-semibold text-faint">
            {monogram}
          </span>
          <div>
            {/*
             * This carried a hardcoded "Sample" badge on every company —
             * including NASDAQ:AMD and every other real one in the coverage
             * universe. Convention #1 reserves that label for clearly
             * fictional entities; on a real issuer it is simply a false
             * statement about the data. The grade badge belongs here instead:
             * it is the one fact about a company this panel actually knows.
             */}
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg text-fg">{company.name}</h2>
              {score?.grade ? <Badge tone={toneOfScore(score.atlasScore)}>{score.grade}</Badge> : null}
            </div>
            <p className="mt-0.5 font-mono text-2xs text-muted">
              {company.exchange}: {company.ticker}
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${company.id}/overview`}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2"
        >
          Open full profile →
        </Link>
      </div>

      <div className="p-4">
        {/*
         * These four tiles were the literal string "—", wired to nothing:
         * Atlas Score read as missing for every company while /v1/scores had
         * a score for it (AMD showed "—" here and 68 on the leaderboard), and
         * Market Cap / Conviction / Upside have no source at all.
         *
         * So: show the score and its factors, which are real, and stop
         * claiming three metrics the platform does not yet carry. Convention
         * #1 — a module whose data does not exist states the blocker instead
         * of rendering an empty tile that looks like a loading failure.
         */}
        {score ? (
          <>
            <StatGrid
              columns={2}
              items={[
                {
                  label: "Atlas Score",
                  value: score.atlasScore === null ? MISSING : String(score.atlasScore),
                  hint: score.grade ? `Grade ${score.grade}` : undefined,
                },
                {
                  label: "As of",
                  value: score.asOf ?? MISSING,
                  hint: "latest annual filing",
                },
              ]}
            />
            <div className="mt-4 rounded-panel border border-border p-4">
              <p className="eyebrow mb-3">Factor profile</p>
              <RankedBars
                bars={FACTOR_KEYS.map((f) => ({
                  label: f.label,
                  value: score.factors[f.key] ?? null,
                }))}
                ariaLabel={`${company.name} factor profile`}
              />
            </div>
          </>
        ) : (
          <PlannedModule
            title="No Atlas Score yet"
            body="This company is in the coverage universe but has no scored annual filings, so it has no score, grade or factor profile to show."
            fields={["Atlas Score", "Grade", "Profitability", "Growth", "Strength", "Cash"]}
            requires="Annual facts ingested for this company — the score is computed from filings, never estimated."
          />
        )}
        <dl className="mt-4 divide-y divide-border rounded-panel border border-border">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between gap-4 px-4 py-2.5"
            >
              <dt className="text-sm text-muted">{f.label}</dt>
              <dd className="font-mono text-sm text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
