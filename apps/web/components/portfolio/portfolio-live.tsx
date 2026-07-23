"use client";

/**
 * Portfolio workspace (P012 v1). Local holdings joined against the live Atlas
 * Score leaderboard to give cost-weighted quality + segment exposure. Market
 * value / P&L are intentionally absent (they need prices — P027); every figure
 * here is on a cost basis and labelled as such.
 */
import { fmtNumber } from "@/lib/format";
import { useState } from "react";
import Link from "next/link";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { DataTable, type Column } from "@/components/data/data-table";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { usePortfolio, type Holding } from "@/lib/loaders/use-portfolio";
import { useLocale } from "@/lib/i18n/use-locale";
import type { ScoreRow } from "@/lib/types";

/** Minimal shape the add-holding selector needs. */
type Pickable = { id: string; name: string; ticker: string };

interface Row extends Holding {
  name: string;
  ticker: string;
  segment: string;
  atlasScore: number | null;
  grade: string;
  costValue: number;
  weight: number;
}

const money = (v: number) => fmtNumber(v, 0);
const scoreTone = (s: number | null): "positive" | "warning" | "negative" | "neutral" =>
  s === null ? "neutral" : s >= 65 ? "positive" : s >= 40 ? "warning" : "negative";

function AddHoldingForm({
  companies,
  onAdd,
}: {
  companies: Pickable[];
  onAdd: (h: Holding) => void;
}) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const [id, setId] = useState(companies[0]?.id ?? "");
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const s = Number(shares);
        const c = Number(cost);
        if (!id || !(s > 0) || !(c > 0)) return;
        onAdd({ id, shares: s, avgCost: c });
        setShares("");
        setCost("");
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col gap-1 text-xs text-muted">
        {zh ? "公司" : "Company"}
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="rounded border border-border-soft bg-surface-3 px-2 py-1.5 text-sm text-fg outline-none"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.ticker})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {zh ? "股数" : "Shares"}
        <input
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="w-28 rounded border border-border-soft bg-surface-3 px-2 py-1.5 text-sm text-fg outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {zh ? "每股均价" : "Avg cost / share"}
        <input
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className="w-32 rounded border border-border-soft bg-surface-3 px-2 py-1.5 text-sm text-fg outline-none"
        />
      </label>
      <button
        type="submit"
        className="rounded border border-accent-dim bg-surface-2 px-4 py-1.5 text-sm text-accent"
      >
        {zh ? "添加 / 更新" : "Add / update"}
      </button>
    </form>
  );
}

export function PortfolioLive() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { holdings, upsert, remove } = usePortfolio();
  const live = isApiConfigured();
  const scores = useApiResource<ScoreRow[]>(live ? "/v1/scores" : null);
  const universe = scores.data ?? [];

  const columns: Column<Row>[] = [
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
    { key: "shares", header: zh ? "股数" : "Shares", numeric: true, sortable: true, render: (r) => money(r.shares) },
    { key: "avgCost", header: zh ? "均价" : "Avg cost", numeric: true, render: (r) => fmtNumber(r.avgCost, 2) },
    { key: "costValue", header: zh ? "持仓成本" : "Cost basis", numeric: true, sortable: true, render: (r) => money(r.costValue) },
    { key: "weight", header: zh ? "权重" : "Weight", numeric: true, sortable: true, render: (r) => `${r.weight.toFixed(1)}%` },
    {
      key: "atlasScore",
      header: zh ? "评分" : "Score",
      numeric: true,
      sortable: true,
      render: (r) => <Badge tone={scoreTone(r.atlasScore)}>{r.atlasScore ?? "—"}</Badge>,
    },
    {
      key: "remove",
      header: "",
      render: (r) => (
        <button type="button" onClick={() => remove(r.id)} className="text-faint hover:text-negative" aria-label={zh ? `移除 ${r.name}` : `Remove ${r.name}`}>
          ✕
        </button>
      ),
    },
  ];

  if (!live) {
    return (
      <EmptyState
        title={zh ? "API 未配置" : "API not configured"}
        body={zh ? "在构建时设置 NEXT_PUBLIC_API_BASE_URL，即可基于实时 Atlas 评分构建投资组合。" : "Set NEXT_PUBLIC_API_BASE_URL at build time to build a portfolio with live Atlas Scores."}
      />
    );
  }

  // Join holdings with the live universe.
  const byId = new Map(universe.map((c) => [c.id, c]));
  const rows: Row[] = holdings.map((h) => {
    const c = byId.get(h.id);
    const costValue = h.shares * h.avgCost;
    return {
      ...h,
      name: c?.name ?? h.id,
      ticker: c?.ticker ?? "—",
      segment: c?.segment ?? "—",
      atlasScore: c?.atlasScore ?? null,
      grade: c?.grade ?? "—",
      costValue,
      weight: 0,
    };
  });
  const totalCost = rows.reduce((a, r) => a + r.costValue, 0);
  for (const r of rows) r.weight = totalCost > 0 ? (r.costValue / totalCost) * 100 : 0;
  rows.sort((a, b) => b.costValue - a.costValue);

  // Cost-weighted Atlas Score (over holdings that have a score).
  const scored = rows.filter((r) => r.atlasScore !== null);
  const scoredCost = scored.reduce((a, r) => a + r.costValue, 0);
  const weightedScore =
    scoredCost > 0
      ? Math.round(scored.reduce((a, r) => a + (r.atlasScore as number) * r.costValue, 0) / scoredCost)
      : null;

  // Segment exposure (by cost weight).
  const bySegment = new Map<string, number>();
  for (const r of rows) bySegment.set(r.segment, (bySegment.get(r.segment) ?? 0) + r.weight);
  const exposure = [...bySegment.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader eyebrow={zh ? "持仓" : "Positions"} title={zh ? "添加持仓" : "Add a holding"} />
        <PanelBody>
          <DataState status={scores.status}>
            <AddHoldingForm companies={universe} onAdd={upsert} />
            <p className="mt-2 text-2xs text-faint">
              {zh
                ? "保存在本浏览器本地。仅为持仓成本口径——市值与盈亏将随实时价格（P027）一并提供。"
                : "Stored locally in your browser. Cost basis only — market value and P&L arrive with live prices (P027)."}
            </p>
          </DataState>
        </PanelBody>
      </Panel>

      {holdings.length === 0 ? (
        <EmptyState title={zh ? "暂无持仓" : "No holdings yet"} body={zh ? "在上方添加一个仓位，即可查看按成本加权的敞口与质量。" : "Add a position above to see cost-weighted exposure and quality."} />
      ) : (
        <>
          <StatGrid
            items={[
              { label: zh ? "持仓数" : "Positions", value: String(rows.length) },
              { label: zh ? "持仓成本" : "Cost basis", value: money(totalCost), hint: zh ? "股数 × 均价之和" : "sum of shares × avg cost" },
              { label: zh ? "加权 Atlas 评分" : "Weighted Atlas Score", value: weightedScore === null ? "—" : String(weightedScore), hint: zh ? "按成本加权" : "cost-weighted" },
              { label: zh ? "最大持仓" : "Top holding", value: rows[0] ? `${rows[0].weight.toFixed(0)}%` : "—", hint: rows[0]?.ticker },
            ]}
          />

          <Panel className="overflow-hidden">
            <DataTable
        mobileCards columnPickerId="portfolio" columns={columns} rows={rows} getRowId={(r) => r.id} caption={zh ? "持仓" : "Holdings"} />
          </Panel>

          <Panel>
            <PanelHeader eyebrow={zh ? "敞口" : "Exposure"} title={zh ? "按板块（成本权重）" : "By segment (cost weight)"} />
            <PanelBody>
              <div className="space-y-2">
                {exposure.map(([seg, w]) => (
                  <div key={seg} className="flex items-center gap-3">
                    <span className="w-48 shrink-0 truncate text-sm text-muted">{seg}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-surface-2">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, w)}%` }} />
                    </div>
                    <span className="num w-12 text-right text-xs text-fg">{w.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>
        </>
      )}
    </div>
  );
}
