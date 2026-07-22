"use client";

/**
 * The industry landing page.
 *
 * This was a grid of cards showing each industry's name above its sector —
 * and the sector was already the group heading directly above the card, so a
 * seven-industry screen carried seven facts and half a page of void. Every
 * figure below already existed in the database; the list endpoint simply never
 * aggregated it.
 *
 * The page now leads with what an analyst actually asks of a taxonomy: where
 * is coverage concentrated, which industries score well, and which ones we
 * have a cost cycle for. Composition is KPI band -> two charts -> one dense
 * sortable table, so the screen is legible at a glance and exhaustive on read.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataState } from "@/components/ui/data-state";
import { ChartContainer } from "@/components/chart/chart-container";
import { RankedBars } from "@/components/chart/ranked-bars";
import { DonutChart } from "@/components/chart/donut";
import { Sparkline } from "@/components/chart/sparkline";
import { DataTable, type Column } from "@/components/data/data-table";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/use-locale";
import { ready } from "@/lib/resource";
import { STATIC_INDUSTRIES } from "@/lib/universe";
import { MISSING, fmtChange, fmtNumber, toneClass } from "@/lib/format";

interface IndustryRow {
  id: string;
  name: string;
  sector: string;
  companyCount?: number;
  scoredCount?: number;
  avgScore?: number | null;
  topScore?: number | null;
  topCompany?: { id: string; name: string; ticker: string } | null;
  tickers?: string[];
  seriesCount?: number;
  cycle?: { latest: number | null; changeYoYPct: number | null; points: number[] } | null;
}

/** Same thresholds as the leaderboard badge — one definition of "good". */
function tone(score: number | null | undefined): "positive" | "warning" | "negative" | "neutral" {
  if (score === null || score === undefined) return "neutral";
  if (score >= 65) return "positive";
  if (score >= 40) return "warning";
  return "negative";
}

export function IndustriesLive() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const live = isApiConfigured();
  const r = useApiResource<IndustryRow[]>("/v1/industries", ready(STATIC_INDUSTRIES));
  const rows = r.data ?? [];

  const totalCompanies = rows.reduce((n, x) => n + (x.companyCount ?? 0), 0);
  const scoredRows = rows.filter((x) => x.avgScore !== null && x.avgScore !== undefined);
  const universeAvg =
    scoredRows.length === 0
      ? null
      : Math.round(
          scoredRows.reduce((s, x) => s + (x.avgScore ?? 0), 0) / scoredRows.length,
        );
  const withSeries = rows.filter((x) => (x.seriesCount ?? 0) > 0).length;

  // Sector concentration — where the coverage universe actually sits.
  const bySector = new Map<string, number>();
  for (const x of rows) {
    bySector.set(x.sector, (bySector.get(x.sector) ?? 0) + (x.companyCount ?? 0));
  }
  const sectorTones = ["var(--accent)", "var(--info)", "var(--positive)", "var(--warning)"];
  const segments = [...bySector.entries()]
    .filter(([, v]) => v > 0)
    .map(([label, value], i) => ({
      label,
      value,
      color: sectorTones[i % sectorTones.length] ?? "var(--accent)",
    }));

  // Average score by industry, ranked — the one chart that ranks the taxonomy.
  // Full names, not truncated: horizontal bars give each label its own line.
  const scoreBars = scoredRows
    .slice()
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .map((x) => ({
      label: x.name,
      value: x.avgScore ?? null,
      hint: `${x.companyCount ?? 0} ${zh ? "家" : "cos"}`,
      href: `/industries/${x.id}`,
    }));

  const columns: Column<IndustryRow>[] = [
    {
      key: "name",
      header: zh ? "行业" : "Industry",
      sortable: true,
      render: (x) => (
        <Link href={`/industries/${x.id}`} className="text-fg hover:text-accent">
          {x.name}
        </Link>
      ),
    },
    { key: "sector", header: zh ? "板块" : "Sector", sortable: true },
    {
      key: "companyCount",
      header: zh ? "公司" : "Cos.",
      numeric: true,
      sortable: true,
      sortAccessor: (x) => x.companyCount ?? 0,
      render: (x) => <span className="num">{x.companyCount ?? MISSING}</span>,
    },
    {
      key: "avgScore",
      header: zh ? "平均评分" : "Avg score",
      numeric: true,
      sortable: true,
      sortAccessor: (x) => x.avgScore ?? -1,
      render: (x) =>
        x.avgScore === null || x.avgScore === undefined ? (
          <span className="text-faint">{MISSING}</span>
        ) : (
          <Badge tone={tone(x.avgScore)}>{x.avgScore}</Badge>
        ),
    },
    {
      key: "topCompany",
      header: zh ? "评分最高" : "Top scorer",
      sortable: true,
      sortAccessor: (x) => x.topScore ?? -1,
      render: (x) =>
        x.topCompany ? (
          <Link
            href={`/companies/${x.topCompany.id}/overview`}
            className="inline-flex items-center gap-2 text-fg hover:text-accent"
          >
            <span className="num text-faint">{x.topScore}</span>
            {x.topCompany.name}
          </Link>
        ) : (
          <span className="text-faint">{MISSING}</span>
        ),
    },
    {
      key: "cycle",
      header: zh ? "利润周期" : "Margin cycle",
      render: (x) =>
        x.cycle && x.cycle.points.length > 1 ? (
          <span className="inline-flex items-center gap-2">
            <Sparkline values={x.cycle.points} ariaLabel={`${x.name} margin cycle`} />
            <span className="num text-xs">{fmtNumber(x.cycle.latest)}</span>
            <span className={`num text-2xs ${toneClass(x.cycle.changeYoYPct)}`}>
              {fmtChange(x.cycle.changeYoYPct)}
            </span>
          </span>
        ) : (
          // Not a failure — most industries have no cost series yet. Say which.
          <span className="text-2xs text-faint">{zh ? "无成本序列" : "no cost series"}</span>
        ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Badge tone="accent">
          {live ? (zh ? "实时分类" : "Live taxonomy") : zh ? "样本分类" : "Sample taxonomy"}
        </Badge>
        <span className="text-xs text-muted">
          {rows.length} {zh ? "个行业" : "industries"}
        </span>
      </div>

      <DataState status={r.status}>
        <div className="mb-6">
          <StatGrid
            items={[
              {
                label: zh ? "行业" : "Industries",
                value: String(rows.length),
                hint: `${bySector.size} ${zh ? "个板块" : "sectors"}`,
              },
              {
                label: zh ? "覆盖公司" : "Companies mapped",
                value: String(totalCompanies),
                hint: `${rows.reduce((n, x) => n + (x.scoredCount ?? 0), 0)} ${zh ? "家已评分" : "scored"}`,
              },
              {
                label: zh ? "平均 Atlas 评分" : "Avg Atlas Score",
                value: universeAvg === null ? MISSING : String(universeAvg),
                hint: zh ? "按行业均值再平均" : "mean of industry means",
              },
              {
                label: zh ? "有成本周期" : "With cost cycle",
                value: `${withSeries} / ${rows.length}`,
                hint: zh ? "其余为研究缺口" : "the rest are research gaps",
              },
            ]}
          />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ChartContainer
            title={zh ? "各行业平均评分" : "Average score by industry"}
            subtitle={
              zh
                ? "同一套 Atlas 因子模型，按行业取均值 — 只统计已评分公司"
                : "The same Atlas factor model, averaged per industry — scored companies only"
            }
            footer={
              zh
                ? "口径见 docs/INVESTMENT-METHODOLOGY.md"
                : "Definition: docs/INVESTMENT-METHODOLOGY.md"
            }
          >
            {scoreBars.length > 0 ? (
              <RankedBars bars={scoreBars} ariaLabel="Average Atlas Score by industry" />
            ) : (
              <p className="py-10 text-center text-xs text-faint">
                {zh ? "尚无已评分公司" : "No scored companies yet"}
              </p>
            )}
          </ChartContainer>

          <ChartContainer
            title={zh ? "覆盖集中度" : "Coverage concentration"}
            subtitle={zh ? "按板块划分的公司数" : "Companies by sector"}
          >
            {segments.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <DonutChart
                  segments={segments}
                  ariaLabel="Companies by sector"
                  centerLabel={zh ? "公司" : "companies"}
                  centerValue={String(totalCompanies)}
                />
                <ul className="flex w-full flex-col gap-1.5">
                  {segments.map((s) => (
                    <li key={s.label} className="flex items-center gap-2 text-2xs">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: s.color }}
                      />
                      <span className="flex-1 truncate text-muted">{s.label}</span>
                      <span className="num text-fg">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-10 text-center text-xs text-faint">
                {zh ? "尚无公司映射" : "No companies mapped yet"}
              </p>
            )}
          </ChartContainer>
        </div>

        <SectionHeading
          title={zh ? "全部行业" : "All industries"}
          description={
            zh
              ? "点击行业进入工作台：成本因子、售价、利润周期与成员公司。"
              : "Open an industry for its cost factors, output prices, margin cycle and member companies."
          }
        />
        <Panel className="overflow-hidden">
          <DataTable
            columnPickerId="industries"
            columns={columns}
            rows={rows}
            getRowId={(x) => x.id}
            searchable
            searchPlaceholder={zh ? "搜索行业" : "Search industries"}
            caption={zh ? "行业分类" : "Industry taxonomy"}
            mobileCards
          />
        </Panel>
      </DataState>
    </>
  );
}
