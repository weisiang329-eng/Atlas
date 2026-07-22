"use client";

/**
 * Atlas Score leaderboard — the coverage universe ranked by systematic factor
 * score. Live from /v1/scores; no sample fallback (a score requires real
 * financials), so without an API configured it shows guidance.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { ChartContainer } from "@/components/chart/chart-container";
import { BarSeries } from "@/components/chart/bar-series";
import { DonutChart } from "@/components/chart/donut";
import { DataTable, type Column } from "@/components/data/data-table";
import { FactorCell } from "@/components/scores/factor-bar";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/use-locale";
import { MISSING } from "@/lib/format";
import type { ScoreRow } from "@/lib/types";

function tone(score: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (score === null) return "neutral";
  if (score >= 65) return "positive";
  if (score >= 40) return "warning";
  return "negative";
}

// The design renders factors as bars, not bare numbers: a column of bars
// shows the shape of a company profile at a glance.
const factorCell = (v: number | null) => <FactorCell score={v} />;

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

/** Grade buckets in rank order, so the donut always reads best-to-worst. */
const GRADES = [
  { key: "A", color: "var(--positive)" },
  { key: "B", color: "var(--accent)" },
  { key: "C", color: "var(--warning)" },
  { key: "D", color: "var(--negative)" },
  { key: "E", color: "var(--border-strong)" },
];

const FACTORS = [
  { key: "profitability", en: "Profitability", zh: "盈利能力", weight: 30 },
  { key: "growth", en: "Growth", zh: "成长", weight: 25 },
  { key: "strength", en: "Strength", zh: "财务强度", weight: 25 },
  { key: "cash", en: "Cash", zh: "现金", weight: 20 },
] as const;

export function RankingsLive() {
  const { locale } = useLocale();
  const zh = locale === "zh";
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

  const rows = r.data ?? [];
  const scored = rows.filter((x) => x.atlasScore !== null);
  const avg =
    scored.length === 0
      ? null
      : Math.round(scored.reduce((s, x) => s + (x.atlasScore ?? 0), 0) / scored.length);
  const top = scored[0] ?? null;

  // Grade mix — the shape of the universe in one ring.
  const gradeSegments = GRADES.map((g) => ({
    label: g.key,
    value: rows.filter((x) => x.grade === g.key).length,
    color: g.color,
  })).filter((s) => s.value > 0);

  /*
   * Factor averages. A leaderboard tells you WHO scores well; this tells you
   * WHY — if the universe averages 80 on profitability and 30 on cash, the
   * ranking is really a cash-generation ranking, and the reader should see
   * that before trusting the order.
   */
  const factorBars = FACTORS.map((f) => {
    const vals = rows
      .map((x) => x.factors[f.key])
      .filter((v): v is number => v !== null && v !== undefined);
    return {
      label: zh ? f.zh : f.en,
      value: vals.length === 0 ? 0 : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    };
  });

  return (
    <DataState status={r.status}>
      <div className="mb-6">
        <StatGrid
          items={[
            {
              label: zh ? "覆盖范围" : "Coverage",
              value: String(rows.length),
              hint: `${scored.length} ${zh ? "家已评分" : "scored"}`,
            },
            {
              label: zh ? "平均评分" : "Average score",
              value: avg === null ? MISSING : String(avg),
              hint: zh ? "仅计已评分公司" : "scored companies only",
            },
            {
              label: zh ? "评分领先" : "Highest score",
              value: top?.atlasScore === null || top === null ? MISSING : String(top.atlasScore),
              hint: top?.name ?? MISSING,
            },
            {
              label: zh ? "A 级公司" : "A-grade",
              value: String(rows.filter((x) => x.grade === "A").length),
              hint: zh ? "评分 ≥ 80" : "score ≥ 80",
            },
          ]}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <ChartContainer
          title={zh ? "评级分布" : "Grade distribution"}
          subtitle={zh ? "覆盖universe的评级构成" : "How the covered universe splits"}
        >
          {gradeSegments.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={gradeSegments}
                ariaLabel="Grade distribution"
                centerLabel={zh ? "家公司" : "companies"}
                centerValue={String(rows.length)}
              />
              <ul className="flex w-full flex-col gap-1.5">
                {gradeSegments.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-2xs">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
                    <span className="flex-1 text-muted">
                      {zh ? `${s.label} 级` : `Grade ${s.label}`}
                    </span>
                    <span className="num text-fg">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-faint">
              {zh ? "尚无评分" : "No scores yet"}
            </p>
          )}
        </ChartContainer>

        <ChartContainer
          title={zh ? "各因子平均分" : "Average score by factor"}
          subtitle={
            zh
              ? `权重：${FACTORS.map((f) => `${f.zh} ${f.weight}%`).join(" · ")}`
              : `Weights: ${FACTORS.map((f) => `${f.en} ${f.weight}%`).join(" · ")}`
          }
          footer={
            zh
              ? "因子最弱的一项决定了这份排名真正在衡量什么"
              : "The weakest factor tells you what this ranking is really measuring"
          }
        >
          <BarSeries data={factorBars} ariaLabel="Average score by factor" height={200} />
        </ChartContainer>
      </div>

      <SectionHeading
        title={zh ? "评分排行榜" : "Leaderboard"}
        description={
          zh
            ? "按 Atlas 评分排序。未评分公司排在末位，绝不用估算值填补。"
            : "Ranked by Atlas Score. Unscored companies sort last — never filled with an estimate."
        }
      />
      <Panel className="overflow-hidden">
        <DataTable
          mobileCards
          columnPickerId="scores"
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          searchable
          searchPlaceholder={zh ? "搜索公司" : "Search companies"}
          caption="Atlas Score leaderboard"
        />
      </Panel>
    </DataState>
  );
}
