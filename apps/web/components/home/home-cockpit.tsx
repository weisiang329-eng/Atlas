"use client";

/**
 * Home — the investment cockpit (P009).
 *
 * Composition follows the Aurora design handoff's Home screen: a KPI strip,
 * then a wide/narrow pair, then an even pair. What differs from the handoff is
 * the data: the handoff prototyped against mocks, this renders the live API and
 * the owner's own local records. Nothing here is sample data.
 *
 * Panels that need live prices (top movers, alerts) are deliberately absent
 * rather than faked — they arrive with P027.
 */
import Link from "next/link";
import { ChartContainer } from "@/components/chart/chart-container";
import { TrendChart } from "@/components/chart/trend-chart";
import { Sparkline } from "@/components/chart/sparkline";
import { StatGrid } from "@/components/ui/stat-grid";
import { fmtChange, fmtNumber, toneClass } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useApiResource } from "@/lib/loaders/use-api";
import { useDecisions } from "@/lib/loaders/use-research";
import { useWatchlist } from "@/lib/loaders/use-watchlist";
import { isApiConfigured } from "@/lib/api/client";
import { useT } from "@/lib/i18n/use-locale";
import type { IndustryDetail, ScoreRow } from "@/lib/types";

function scoreTone(s: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (s === null) return "neutral";
  if (s >= 65) return "positive";
  if (s >= 40) return "warning";
  return "negative";
}

const CONVICTION_TONE = {
  high: "positive",
  medium: "warning",
  low: "neutral",
} as const;

export function HomeCockpit() {
  const t = useT();
  const live = isApiConfigured();
  const scores = useApiResource<ScoreRow[]>(live ? "/v1/scores" : null);
  const gloves = useApiResource<IndustryDetail>(
    live ? "/v1/industries/rubber-gloves" : null,
  );
  const { items: decisions } = useDecisions();
  const { ids: watchIds } = useWatchlist();

  const rows = scores.data ?? [];
  const scored = rows.filter((r) => r.atlasScore !== null);
  const aGrade = rows.filter((r) => r.grade === "A").length;
  const top = rows.slice(0, 8);
  const cycle = gloves.data?.cycleSignal;

  const watched = rows.filter((r) => watchIds.includes(r.id));
  const recentDecisions = [...decisions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <>
      <div className="mb-6">
        <StatGrid
          items={[
            {
              label: t("home.coverage"),
              value: rows.length ? String(rows.length) : "—",
              hint: t("home.companies"),
            },
            {
              label: t("score.atlasScore"),
              value: scored.length ? String(scored.length) : "—",
              hint: `${aGrade} × A`,
            },
            {
              label: t("home.topScores"),
              value: top[0]?.atlasScore != null ? String(top[0].atlasScore) : "—",
              hint: top[0]?.ticker ?? undefined,
            },
            {
              label: t("home.cycle"),
              value: cycle?.latest != null ? String(cycle.latest) : "—",
              hint: t("home.cycleHint"),
            },
          ]}
        />
      </div>

      {/* Wide / narrow pair — the handoff's primary row. */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ChartContainer
          title={t("home.topRanked")}
          subtitle={t("score.leaderboard")}
          status={scores.status}
          actions={
            <Link
              href="/scores"
              className="font-mono text-2xs uppercase tracking-wide text-accent transition-opacity hover:opacity-80"
            >
              {t("home.allRankings")} &rarr;
            </Link>
          }
        >
          <ul className="flex flex-col divide-y divide-border">
            {top.map((r, i) => (
              <li key={r.id}>
                <Link
                  href={`/companies/${r.id}/overview`}
                  className="-mx-2 flex items-center gap-3 rounded px-2 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="num w-5 shrink-0 text-right text-xs text-faint">
                    {i + 1}
                  </span>
                  <Badge tone={scoreTone(r.atlasScore)}>
                    {r.atlasScore ?? "—"}
                  </Badge>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-fg">{r.name}</span>
                    <span className="truncate text-2xs text-faint">
                      {r.segment}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {r.ticker}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ChartContainer>

        <ChartContainer
          title={t("home.cycleTitle")}
          subtitle={t("home.cycleSub")}
          status={gloves.status}
          actions={
            <Link
              href="/industries/rubber-gloves"
              className="font-mono text-2xs uppercase tracking-wide text-accent transition-opacity hover:opacity-80"
            >
              {t("common.open")} &rarr;
            </Link>
          }
        >
          {gloves.data ? (
            <div className="flex flex-col gap-4">
              {/*
               * `cycle` was computed and never drawn, so a chart-sized panel
               * held two list rows and 380px of void — the single biggest
               * empty area on the dashboard. The signal IS a time series;
               * plot it, and let the latest reading sit on top as the number
               * a reader takes away.
               */}
              {cycle && cycle.points.length > 1 ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="num text-2xl text-fg">
                      {fmtNumber(cycle.latest)}
                    </span>
                    <span className={`num text-xs ${toneClass(cycle.changeYoYPct)}`}>
                      {fmtChange(cycle.changeYoYPct)} YoY
                    </span>
                  </div>
                  <TrendChart
                    data={cycle.points.map((p) => ({
                      label: p.date.slice(0, 7),
                      value: p.value,
                    }))}
                    ariaLabel="Glove margin cycle signal"
                    height={140}
                  />
                </>
              ) : null}

              <dl className="flex flex-col gap-2">
                {gloves.data.series.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between gap-3 rounded bg-surface-3 px-3 py-2"
                  >
                    <dt className="min-w-0 flex-1 truncate text-xs text-muted">
                      {s.label}
                    </dt>
                    {/* A row of numbers with no shape hides the trend that
                        makes the number mean anything. */}
                    <Sparkline
                      values={s.points.slice(-24).map((p) => p.value)}
                      ariaLabel={`${s.label} trend`}
                      width={72}
                      height={20}
                    />
                    <dd className="num shrink-0 text-sm text-fg">
                      {fmtNumber(s.points.at(-1)?.value ?? null)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </ChartContainer>
      </div>

      {/* Even pair — the owner's own records. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title={t("home.watchlist")}
          subtitle={`${watchIds.length} ${t("home.companies")}`}
          actions={
            <Link
              href="/watchlist"
              className="font-mono text-2xs uppercase tracking-wide text-accent transition-opacity hover:opacity-80"
            >
              {t("common.open")} &rarr;
            </Link>
          }
        >
          {watched.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("home.watchlistEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {watched.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/companies/${r.id}/overview`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded px-2 py-2.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-fg">
                        {r.ticker}
                      </span>
                      <span className="truncate text-2xs text-faint">
                        {r.name}
                      </span>
                    </div>
                    <Badge tone={scoreTone(r.atlasScore)}>
                      {r.atlasScore ?? "—"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ChartContainer>

        <ChartContainer
          title={t("home.decisions")}
          subtitle={t("home.decisionsSub")}
          actions={
            <Link
              href="/research/decision-journal"
              className="font-mono text-2xs uppercase tracking-wide text-accent transition-opacity hover:opacity-80"
            >
              {t("common.open")} &rarr;
            </Link>
          }
        >
          {recentDecisions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("home.decisionsEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentDecisions.map((d) => (
                <li key={d.id} className="flex items-start gap-3 py-2.5">
                  <Badge tone={CONVICTION_TONE[d.conviction]}>
                    {d.conviction}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{d.decision}</p>
                    <p className="num text-2xs text-faint">{d.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartContainer>
      </div>
    </>
  );
}
