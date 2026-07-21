"use client";

/**
 * Investment cockpit (P009) — the live Home. Coverage stats, the top of the
 * Atlas Score leaderboard, and the industry cycle snapshot, all from the API.
 * Falls back to a quiet loading state when unconfigured (the marketing copy
 * and workspace nav in page.tsx render regardless).
 */
import Link from "next/link";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type { IndustryDetail, ScoreRow } from "@/lib/types";

function scoreTone(s: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (s === null) return "neutral";
  if (s >= 65) return "positive";
  if (s >= 40) return "warning";
  return "negative";
}

export function HomeDashboard() {
  const live = isApiConfigured();
  const scores = useApiResource<ScoreRow[]>(live ? "/v1/scores" : null);
  const gloves = useApiResource<IndustryDetail>(
    live ? "/v1/industries/rubber-gloves" : null,
  );

  if (!live) {
    return (
      <Panel className="mb-6">
        <PanelBody>
          <p className="text-sm text-muted">
            Configure <code className="text-fg">NEXT_PUBLIC_API_BASE_URL</code> to
            load live coverage, Atlas Score rankings and industry cycle signals.
          </p>
        </PanelBody>
      </Panel>
    );
  }

  const rows = scores.data ?? [];
  const scored = rows.filter((r) => r.atlasScore !== null);
  const aGrade = rows.filter((r) => r.grade === "A").length;
  const top = rows.slice(0, 6);
  const cycle = gloves.data?.cycleSignal;

  return (
    <>
      <div className="mb-6">
        <StatGrid
          items={[
            { label: "Companies covered", value: String(rows.length), hint: "coverage universe" },
            { label: "Scored", value: String(scored.length), hint: `${aGrade} A-grade` },
            {
              label: "Top Atlas Score",
              value: top[0]?.atlasScore != null ? String(top[0].atlasScore) : "—",
              hint: top[0]?.ticker ?? undefined,
            },
            {
              label: "Glove margin cycle",
              value: cycle?.latest != null ? String(cycle.latest) : "—",
              hint: "indexed · 100 = 2019",
            },
          ]}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            eyebrow="Atlas Score"
            title="Top ranked"
            action={
              <Link href="/scores" className="font-mono text-2xs uppercase tracking-wide text-accent">
                All rankings &rarr;
              </Link>
            }
          />
          <PanelBody className="p-0">
            <DataState status={scores.status}>
              <ul className="divide-y divide-border">
                {top.map((r, i) => (
                  <li key={r.id}>
                    <Link
                      href={`/companies/${r.id}/overview`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2"
                    >
                      <span className="num w-5 text-right text-xs text-faint">{i + 1}</span>
                      <Badge tone={scoreTone(r.atlasScore)}>{r.atlasScore ?? "—"}</Badge>
                      <span className="flex-1 text-sm text-fg">{r.name}</span>
                      <span className="font-mono text-xs text-muted">{r.ticker}</span>
                      <span className="hidden text-xs text-faint sm:inline">{r.segment}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </DataState>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="Industry cycle"
            title="Rubber gloves"
            action={
              <Link href="/industries/rubber-gloves" className="font-mono text-2xs uppercase tracking-wide text-accent">
                Open &rarr;
              </Link>
            }
          />
          <PanelBody>
            <DataState status={gloves.status}>
              {gloves.data ? (
                <dl className="space-y-3">
                  {gloves.data.series.map((s) => (
                    <div key={s.key} className="flex items-baseline justify-between">
                      <dt className="text-sm text-muted">{s.label}</dt>
                      <dd className="text-right">
                        <span className="num text-sm text-fg">
                          {s.latest?.toLocaleString("en-US") ?? "—"}
                        </span>
                        <span className="ml-1 text-2xs text-faint">{s.unit}</span>
                      </dd>
                    </div>
                  ))}
                  {cycle ? (
                    <div className="flex items-baseline justify-between border-t border-border pt-3">
                      <dt className="text-sm text-muted">Margin cycle</dt>
                      <dd className="num text-sm text-fg">
                        {cycle.latest}
                        <span className="ml-1 text-2xs text-faint">
                          idx {cycle.changeYoYPct != null ? `(${cycle.changeYoYPct >= 0 ? "+" : ""}${cycle.changeYoYPct}% YoY)` : ""}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </DataState>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
