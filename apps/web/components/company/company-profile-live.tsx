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
import { useLocale } from "@/lib/i18n/use-locale";
import { ready, type Resource } from "@/lib/resource";
import { getStaticCompany } from "@/lib/universe";
import type { CompanyProfile, ScoreResult } from "@/lib/types";

function useCompanyProfile(companyId: string): Resource<CompanyProfile> {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const stub = getStaticCompany(companyId);
  const fallback: CompanyProfile = {
    id: companyId,
    name: stub?.name ?? (zh ? "未知公司" : "Unknown company"),
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
  const { locale } = useLocale();
  const zh = locale === "zh";
  const r = useCompanyProfile(companyId);
  const c = r.data;
  const score = useApiResource<ScoreResult>(`/v1/companies/${companyId}/score`);
  const s = score.data;

  const facts = [
    { label: zh ? "板块" : "Segment", value: dash(c?.segment) },
    { label: zh ? "交易所" : "Exchange", value: dash(c?.exchange) },
    { label: zh ? "代码" : "Ticker", value: dash(c?.ticker) },
    { label: zh ? "国家/地区" : "Country", value: dash(c?.country) },
    { label: zh ? "成立年份" : "Founded", value: dash(c?.foundedYear) },
    { label: zh ? "总部" : "Headquarters", value: dash(c?.headquarters) },
  ];

  return (
    <>
      <SectionHeading
        title={zh ? "总览" : "Overview"}
        description={
          zh
            ? "投资逻辑速览。Atlas 评分是基于基本面的系统化因子评分，并非投资建议。股价与市值将随市场数据一并提供（P027）。"
            : "Snapshot of the investment case. Atlas Score is a systematic factor score from fundamentals — not investment advice. Price and market cap arrive with market data (P027)."
        }
      />

      <div className="mb-6">
        <StatGrid
          items={[
            {
              label: zh ? "Atlas 评分" : "Atlas Score",
              value: s?.atlasScore === null || s?.atlasScore === undefined ? "—" : `${s.atlasScore}`,
              hint: s?.grade && s.grade !== "—" ? (zh ? `评级 ${s.grade} · 截至 ${s.asOf}` : `Grade ${s.grade} · as of ${s.asOf}`) : undefined,
            },
            ...(s?.factors ?? []).slice(0, 3).map((f) => ({
              label: f.label,
              value: f.score === null ? "—" : String(Math.round(f.score)),
              hint: zh ? `权重 ${Math.round(f.weight * 100)}%` : `weight ${Math.round(f.weight * 100)}%`,
            })),
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader eyebrow={zh ? "业务" : "Business"} title={zh ? "公司业务概览" : "What this company does"} />
          <PanelBody>
            <DataState status={r.status}>
              {c?.description ? (
                <p className="text-sm leading-relaxed text-fg">{c.description}</p>
              ) : (
                <EmptyState
                  title={zh ? "暂无业务概述" : "No business summary yet"}
                  body={
                    zh
                      ? "此处将显示来源可溯的公司业务描述。"
                      : "A sourced description of the company's business will render here."
                  }
                />
              )}
            </DataState>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader eyebrow={zh ? "参考" : "Reference"} title={zh ? "关键信息" : "Key facts"} />
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
          <PanelHeader eyebrow={zh ? "Atlas 评分" : "Atlas Score"} title={zh ? "因子拆解" : "Factor breakdown"} />
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
  const { locale } = useLocale();
  const zh = locale === "zh";
  const r = useCompanyProfile(companyId);
  const c = r.data;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: zh ? "法定名称" : "Legal name", value: dash(c?.name) },
    { label: zh ? "代码" : "Ticker", value: dash(c?.ticker) },
    { label: zh ? "交易所" : "Exchange", value: dash(c?.exchange) },
    { label: zh ? "主营板块" : "Primary segment", value: dash(c?.segment) },
    { label: zh ? "国家/地区" : "Country", value: dash(c?.country) },
    { label: zh ? "成立年份" : "Founded", value: dash(c?.foundedYear) },
    { label: zh ? "总部" : "Headquarters", value: dash(c?.headquarters) },
    { label: zh ? "报告货币" : "Reporting currency", value: dash(c?.reportingCurrency) },
    {
      label: zh ? "网站" : "Website",
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
      label: zh ? "行业" : "Industry",
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
        title={zh ? "档案" : "Profile"}
        description={
          zh
            ? "公司身份与参考属性，来自覆盖数据库并附有来源元数据。"
            : "Company identity and reference attributes, from the coverage database with source metadata."
        }
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
