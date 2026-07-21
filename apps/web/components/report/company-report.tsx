"use client";

/**
 * Auto-generated company report (P013 v1). Assembles a board-ready brief from
 * data the platform already holds — profile (P005), financials + ratios
 * (P004), Atlas Score + factors (P010), relationships (P007) — into the
 * report section rhythm. Print-friendly. Every figure is sourced; nothing is
 * written by hand, so the report can never drift from the data.
 */
import Link from "next/link";
import { ReportSection } from "@/components/report/report-section";
import { StatGrid } from "@/components/ui/stat-grid";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatementTable } from "@/components/data/statement-table";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type {
  CompanyFinancials,
  CompanyProfile,
  ScoreResult,
} from "@/lib/types";

interface EgoGraph {
  relations: { id: string; name: string; relation: string; label: string | null; note: string | null }[];
}

const grpTone = (g: string): "positive" | "warning" | "negative" | "neutral" => {
  if (["A", "B"].includes(g)) return "positive";
  if (g === "C") return "warning";
  if (["D", "E"].includes(g)) return "negative";
  return "neutral";
};

export function CompanyReport({ companyId }: { companyId: string }) {
  const live = isApiConfigured();
  const profile = useApiResource<CompanyProfile>(live ? `/v1/companies/${companyId}` : null);
  const fin = useApiResource<CompanyFinancials>(live ? `/v1/companies/${companyId}/financials` : null);
  const score = useApiResource<ScoreResult>(live ? `/v1/companies/${companyId}/score` : null);
  const graph = useApiResource<EgoGraph>(live ? `/v1/graph/company/${companyId}` : null);

  if (!live) {
    return (
      <EmptyState
        title="API not configured"
        body="Set NEXT_PUBLIC_API_BASE_URL at build time to generate live company reports."
      />
    );
  }

  const p = profile.data;
  const f = fin.data;
  const s = score.data;
  const rels = graph.data?.relations ?? [];
  const latest = <T,>(xs: T[] | undefined) => (xs && xs.length ? xs[xs.length - 1] : undefined);

  return (
    <DataState status={profile.status}>
      <div className="max-w-3xl">
        {/* Header */}
        <header className="mb-6">
          <p className="eyebrow mb-1">Atlas company report</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold text-fg">
              {p?.name ?? companyId}
            </h1>
            <span className="font-mono text-sm text-muted">
              {p?.exchange}: {p?.ticker}
            </span>
            {s?.grade && s.grade !== "—" ? (
              <Badge tone={grpTone(s.grade)}>
                Atlas Score {s.atlasScore} · {s.grade}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-2xs text-faint">
            Auto-generated from sourced data. Not investment advice. As of{" "}
            {f?.periods?.[f.periods.length - 1] ?? "—"}.
          </p>
        </header>

        <div className="space-y-7">
          {/* Business */}
          <ReportSection id="business" title="Business" eyebrow="Overview">
            {p?.description ? (
              <p className="text-sm leading-relaxed text-fg">{p.description}</p>
            ) : (
              <p className="text-sm text-muted">No business summary on file.</p>
            )}
            <div className="mt-4">
              <StatGrid
                items={[
                  { label: "Segment", value: p?.segment ?? "—" },
                  { label: "Country", value: p?.country ?? "—" },
                  { label: "Founded", value: p?.foundedYear ? String(p.foundedYear) : "—" },
                  { label: "Currency", value: p?.reportingCurrency ?? "—" },
                ]}
              />
            </div>
          </ReportSection>

          {/* Financial snapshot */}
          <ReportSection id="financials" title="Financial snapshot" eyebrow="P004">
            <DataState status={fin.status} empty={<p className="text-sm text-muted">No financial coverage.</p>}>
              {f ? (
                <>
                  <div className="mb-4">
                    <StatGrid
                      items={[
                        { label: `Revenue (${f.periods.at(-1)})`, value: latest(f.trends.revenue)?.value.toLocaleString("en-US") ?? "—", hint: f.unit },
                        { label: "Net income", value: latest(f.trends.netIncome)?.value.toLocaleString("en-US") ?? "—", hint: f.unit },
                        { label: "Free cash flow", value: latest(f.trends.freeCashFlow)?.value.toLocaleString("en-US") ?? "—", hint: f.unit },
                        { label: "Coverage", value: `${f.periods.length} yrs`, hint: f.periods[0] },
                      ]}
                    />
                  </div>
                  <Panel className="overflow-hidden">
                    <StatementTable
                      periods={f.periods}
                      rows={f.statements.incomeStatement}
                      unit={f.unit}
                      caption={`${p?.name ?? ""} — income statement`}
                    />
                  </Panel>
                </>
              ) : null}
            </DataState>
          </ReportSection>

          {/* Atlas Score */}
          <ReportSection id="score" title="Atlas Score" eyebrow="P010 · systematic factors">
            <DataState status={score.status} empty={<p className="text-sm text-muted">Not enough data to score.</p>}>
              {s ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {s.factors.map((factor) => (
                    <KpiCard
                      key={factor.key}
                      label={factor.label}
                      value={factor.score === null ? "—" : String(Math.round(factor.score))}
                    />
                  ))}
                </div>
              ) : null}
              {s ? <p className="mt-2 text-2xs text-faint">{s.note}</p> : null}
            </DataState>
          </ReportSection>

          {/* Relationships */}
          <ReportSection id="relationships" title="Supply chain & competition" eyebrow="P007">
            {rels.length > 0 ? (
              <Panel>
                <PanelBody className="p-0">
                  <dl className="divide-y divide-border">
                    {rels.map((r) => (
                      <div key={`${r.id}-${r.relation}`} className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <div>
                          <Link href={`/companies/${r.id}/overview`} className="text-sm text-fg hover:text-accent">
                            {r.name}
                          </Link>
                          {r.note ? <p className="text-xs text-muted">{r.note}</p> : null}
                        </div>
                        <Badge tone="neutral">{r.relation}{r.label ? ` · ${r.label}` : ""}</Badge>
                      </div>
                    ))}
                  </dl>
                </PanelBody>
              </Panel>
            ) : (
              <p className="text-sm text-muted">No mapped relationships.</p>
            )}
          </ReportSection>
        </div>
      </div>
    </DataState>
  );
}
