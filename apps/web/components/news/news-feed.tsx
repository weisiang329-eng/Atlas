"use client";

import { useMemo, useState } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { NEWS_ITEMS, CATEGORY_LABEL } from "@/lib/mock/news";

function priorityTone(p: number): "negative" | "warning" | "info" | "neutral" {
  return p >= 5 ? "negative" : p >= 4 ? "warning" : p >= 3 ? "info" : "neutral";
}
const PRIORITY_LABEL: Record<number, string> = { 5: "URGENT", 4: "高", 3: "中", 2: "低", 1: "低" };

export function NewsFeed() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");

  const filtered = useMemo(() => {
    return NEWS_ITEMS.filter((n) => {
      if (category !== "all" && n.category !== category) return false;
      if (country !== "all" && n.country !== country) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.entities.some((e) => e.toLowerCase().includes(q));
    }).sort((a, b) => b.priority - a.priority || b.publishedAt - a.publishedAt);
  }, [query, category, country]);

  const urgent = NEWS_ITEMS.filter((n) => n.priority >= 5);
  const countries = Array.from(new Set(NEWS_ITEMS.map((n) => n.country)));

  return (
    <div className="flex flex-col gap-4">
      {urgent.length > 0 ? (
        <div className="flex items-center gap-2 rounded-panel border border-negative/40 bg-negative/10 px-4 py-3">
          <Badge tone="negative">URGENT</Badge>
          <span className="text-sm text-fg">{urgent.length} 条最高评级新闻已推送 · 最新：{urgent[0]!.title}</span>
        </div>
      ) : null}

      <FilterBar
        search={query}
        onSearch={setQuery}
        placeholder="Search news…"
        filters={[
          { label: "全部类别", value: "all" },
          ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ label, value })),
        ]}
        active={category}
        onFilter={setCategory}
        right={`${filtered.length} 条`}
      />

      <div className="flex flex-wrap gap-1.5">
        {["all", ...countries].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCountry(c)}
            className={`rounded-pill border px-2.5 py-1 font-mono text-2xs uppercase tracking-wide transition-colors ${country === c ? "border-accent-dim bg-surface-2 text-fg" : "border-border text-faint hover:text-fg"}`}
          >
            {c === "all" ? "全部国家" : c}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.map((n) => (
          <li key={n.id} className={`rounded-panel border bg-surface p-4 shadow-panel ${n.priority >= 5 ? "border-negative/40" : "border-border"}`}>
            <div className="flex items-start gap-3">
              <Badge tone={priorityTone(n.priority)}>{PRIORITY_LABEL[n.priority]}</Badge>
              <div className="min-w-0 flex-1">
                <a href={n.url} className="text-sm font-medium text-fg hover:text-accent">{n.title}</a>
                <p className="mt-1 text-sm text-muted">{n.summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-faint">
                  <Badge tone="neutral">{CATEGORY_LABEL[n.category]}</Badge>
                  <span>{n.country}</span>
                  {n.entities.map((e) => (
                    <span key={e} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-fg">{e}</span>
                  ))}
                  <span className="ml-auto">{n.source} · {formatRelative(n.publishedAt)}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
