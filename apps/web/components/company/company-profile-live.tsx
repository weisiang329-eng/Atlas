"use client";

/**
 * Company profile + overview — live company-intelligence subpages (P005 v1).
 * Both read one profile fetch (/v1/companies/:id) through the loader seam.
 * Without an API configured, identity fields fall back to the static universe
 * snapshot and the sourced attributes (description, HQ, founded, website)
 * render as "—" rather than fabricated.
 */
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { CompanyNews } from "@/components/company/company-news";
import { useApiResource } from "@/lib/loaders/use-api";
import { ready, type Resource } from "@/lib/resource";
import { getStaticCompany } from "@/lib/universe";
import type { CompanyProfile, ScoreResult } from "@/lib/types";

function useCompanyProfile(companyId: string): Resource<CompanyProfile> {
  const stub = getStaticCompany(companyId);
  const fallback: CompanyProfile = {
    id: companyId,
    name: stub?.name ?? "Unknown company",
    ticker: stub?.ticker ?? "—",
    exchange: stub?.exchange ?? "—",
    segment: stub?.segment ?? "—",
    country: stub?.country ?? "—",
    industryId: null,
    description: null,
    headquarters: null,
    foundedYear: null,
    website: null,
    reportingCurrency: "—",
  };
  return useApiResource<CompanyProfile>(
    `/v1/companies/${companyId}`,
    ready(fallback),
  );
}

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

// --- Overview ---------------------------------------------------------------

export function CompanyOverviewLive({ companyId }: { companyId: string }) {
  const r = useCompanyProfile(companyId);
  const c = r.data;
  const score = useApiResource<ScoreResult>(`/v1/companies/${companyId}/score`);
  const s = score.data;

  const facts = [
    { label: "Segment", value: dash(c?.segment) },
    { label: "Exchange", value: dash(c?.exchange) },
    { label: "Ticker", value: dash(c?.ticker) },
    { label: "Country", value: dash(c?.country) },
    { label: "Founded", value: dash(c?.foundedYear) },
    { label: "Headquarters", value: dash(c?.headquarters) },
  ];

  return (
    <>
      <SectionHeading
        title="Overview"
        description="Snapshot of the investment case. Atlas Score is a systematic factor score from fundamentals — not investment advice. Price and market cap arrive with market data (P027)."
      />

      <div className="mb-6">
        <StatGrid
          items={[
            {
              label: "Atlas Score",
              value: s?.atlasScore === null || s?.atlasScore === undefined ? "—" : `${s.atlasScore}`,
              hint: s?.grade && s.grade !== "—" ? `Grade ${s.grade} · as of ${s.asOf}` : undefined,
            },
            ...(s?.factors ?? []).slice(0, 3).map((f) => ({
              label: f.label,
              value: f.score === null ? "—" : String(Math.round(f.score)),
              hint: `weight ${Math.round(f.weight * 100)}%`,
            })),
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader eyebrow="Business" title="What this company does" />
          <PanelBody>
            <DataState status={r.status}>
              {c?.description ? (
                <p className="text-sm leading-relaxed text-fg">{c.description}</p>
              ) : (
                <EmptyState
                  title="No business summary yet"
                  body="A sourced description of the company's business will render here."
                />
              )}
            </DataState>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Reference" title="Key facts" />
          <PanelBody className="p-0">
            <dl className="divide-y divide-border">
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
          </PanelBody>
        </Panel>
      </div>

      {s && s.factors.length > 0 ? (
        <div className="mt-6">
          <PanelHeader eyebrow="Atlas Score" title="Factor breakdown" />
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.factors.map((f) => (
              <Panel key={f.key}>
                <PanelBody>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">{f.label}</span>
                    <span className="num text-lg font-semibold text-fg">
                      {f.score === null ? "—" : Math.round(f.score)}
                    </span>
                  </div>
                  <p className="mt-1 text-2xs text-faint">{f.rationale}</p>
                  <dl className="mt-2 space-y-1">
                    {f.metrics.map((m) => (
                      <div key={m.label} className="flex justify-between text-xs">
                        <dt className="text-muted">{m.label}</dt>
                        <dd className="num text-fg">
                          {m.value}
                          <span className="ml-1 text-faint">({m.score})</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </PanelBody>
              </Panel>
            ))}
          </div>
          <p className="mt-2 text-2xs text-faint">{s.note}</p>
        </div>
      ) : null}

      <CompanyNews companyId={companyId} />
    </>
  );
}

// --- Profile ----------------------------------------------------------------

export function CompanyProfileLive({ companyId }: { companyId: string }) {
  const r = useCompanyProfile(companyId);
  const c = r.data;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Legal name", value: dash(c?.name) },
    { label: "Ticker", value: dash(c?.ticker) },
    { label: "Exchange", value: dash(c?.exchange) },
    { label: "Primary segment", value: dash(c?.segment) },
    { label: "Country", value: dash(c?.country) },
    { label: "Founded", value: dash(c?.foundedYear) },
    { label: "Headquarters", value: dash(c?.headquarters) },
    { label: "Reporting currency", value: dash(c?.reportingCurrency) },
    {
      label: "Website",
      value: c?.website ? (
        <a
          href={c.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {c.website.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        "—"
      ),
    },
    {
      label: "Industry",
      value: c?.industryId ? (
        <Link href={`/industries/${c.industryId}`} className="text-accent hover:underline">
          {c.industryId}
        </Link>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <>
      <SectionHeading
        title="Profile"
        description="Company identity and reference attributes, from the coverage database with source metadata."
      />
      <DataState status={r.status}>
        <Panel>
          <PanelBody className="p-0">
            <dl className="grid grid-cols-1 sm:grid-cols-2">
              {rows.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-4 border-border px-5 py-3 ${
                    i % 2 === 0 ? "sm:border-r" : ""
                  } border-b`}
                >
                  <dt className="text-sm text-muted">{row.label}</dt>
                  <dd className="truncate text-right font-mono text-sm text-fg">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>
      </DataState>
    </>
  );
}
