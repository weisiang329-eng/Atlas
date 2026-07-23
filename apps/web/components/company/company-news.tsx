"use client";

/**
 * Recent news for one company — the in-app answer to "click a company, see its
 * news" that the owner asked for on 2026-07-23.
 *
 * It reads `GET /v1/news?company=<id>`, the company-scoped view of the same
 * feed the /news page renders, so it inherits that page's honesty rules: a
 * headline links OUT to its source (Atlas stores a title and a link, never an
 * article body), the source falls back to the link host when the feed named no
 * publisher, and nothing here reads a number — a headline is a monitoring
 * signal, not a source of record. There is deliberately no summary or "Atlas
 * analysis" line: none is computed, and inventing one would be the same defect
 * as a fabricated citation.
 */
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { useLocale } from "@/lib/i18n/use-locale";
import { fmtRelative } from "@/lib/format";
import type { NewsFeed } from "@/lib/types";

const LIMIT = 8;

export function CompanyNews({ companyId }: { companyId: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const r = useApiResource<NewsFeed>(
    `/v1/news?company=${encodeURIComponent(companyId)}&limit=${LIMIT}`,
  );
  const items = r.data?.items ?? [];

  return (
    <div className="mt-6">
      <Panel>
        <PanelHeader
          eyebrow={zh ? "监控" : "Monitoring"}
          title={zh ? "近期新闻" : "Recent news"}
        />
        <PanelBody className="p-0">
          <DataState status={r.status}>
            {items.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title={zh ? "暂无已标记的新闻" : "No tagged headlines yet"}
                  body={
                    zh
                      ? "抓取到提及本公司的新闻后会显示在这里。新闻只作监控信号，不作为数据来源。"
                      : "Headlines that mention this company will appear here once pulled. News is a monitoring signal, never a source of record."
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium text-fg hover:text-accent"
                    >
                      {n.title}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-faint">
                      <span
                        title={
                          n.sourceDerived
                            ? zh
                              ? "源站未提供发布方，这里显示的是链接域名"
                              : "The feed named no publisher; this is the link's host"
                            : undefined
                        }
                      >
                        {n.source}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{fmtRelative(n.publishedAt, locale)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </PanelBody>
      </Panel>
    </div>
  );
}
