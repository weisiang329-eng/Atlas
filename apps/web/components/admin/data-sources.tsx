"use client";

/**
 * Data Sources — every external source in one place.
 *
 * Registration links and steps used to live scattered across chat, which is
 * exactly where they get lost. This page is the single list: what is
 * connected, what is rate-limited to what, what is still waiting on a key, and
 * what was tried and rejected — with the reason, so nobody re-adds it.
 */
import { useCallback, useEffect, useState } from "react";
import { ChartContainer } from "@/components/chart/chart-container";
import { StatGrid } from "@/components/ui/stat-grid";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/cn";

interface Source {
  id: string;
  name: string;
  serves: string;
  status: "connected" | "awaiting-key" | "rejected";
  secretName?: string;
  registerUrl?: string;
  steps?: string[];
  docsUrl?: string;
  publishedLimit: string;
  minIntervalMs: number;
  rejectedReason?: string;
  priority?: number;
  keyPresent: boolean | null;
}

interface Registry {
  sources: Source[];
  summary: { connected: number; awaitingKey: number; rejected: number };
}

/** Published limit expressed as the rate Atlas actually calls at. */
function actualRate(ms: number, zh: boolean): string {
  if (ms <= 0) return "—";
  if (ms >= 1000) {
    const perMin = Math.floor(60000 / ms);
    return zh ? `实际 ${perMin} 次/分钟` : `${perMin}/min in practice`;
  }
  const perSec = (1000 / ms).toFixed(1);
  return zh ? `实际 ${perSec} 次/秒` : `${perSec}/s in practice`;
}

export function DataSources() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const live = isApiConfigured();
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    live ? "loading" : "ready",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return setStatus("ready");
    try {
      setRegistry(await apiFetch<Registry>("/v1/ingest/sources"));
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not load sources.");
    }
  }, [live]);

  useEffect(() => {
    void load();
  }, [load]);

  const sources = registry?.sources ?? [];
  const connected = sources.filter((s) => s.status === "connected");
  const waiting = sources
    .filter((s) => s.status === "awaiting-key" && !s.keyPresent)
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  const arrived = sources.filter(
    (s) => s.status === "awaiting-key" && s.keyPresent,
  );
  const rejected = sources.filter((s) => s.status === "rejected");

  return (
    <DataState status={status} error={error ?? undefined}>
      <div className="mb-6">
        <StatGrid
          items={[
            {
              label: zh ? "已连接" : "Connected",
              value: String(connected.length + arrived.length),
              hint: zh ? "免费 · 无需 key" : "free, no key",
            },
            {
              label: zh ? "等待 key" : "Awaiting key",
              value: String(waiting.length),
              hint: zh ? "需要你注册" : "needs you",
            },
            {
              label: zh ? "已否决" : "Rejected",
              value: String(rejected.length),
              hint: zh ? "试过不可用" : "tried, unusable",
            },
            {
              label: zh ? "限流" : "Throttling",
              value: zh ? "已启用" : "on",
              hint: zh ? "按各家公布限制" : "per published limit",
            },
          ]}
        />
      </div>

      {waiting.length > 0 ? (
        <div className="mb-6">
          <ChartContainer
            title={zh ? "等你处理" : "Waiting on you"}
            subtitle={
              zh
                ? "免费注册，拿到 key 后照步骤设进 Worker"
                : "Free to register; set the key on the Worker and tell Atlas"
            }
          >
            <div className="flex flex-col gap-3">
              {waiting.map((s) => (
                <div
                  key={s.id}
                  className="rounded-panel border border-border bg-surface-3 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {s.priority ? (
                      <Badge tone="accent">#{s.priority}</Badge>
                    ) : null}
                    <h3 className="font-serif text-sm font-semibold text-fg">
                      {s.name}
                    </h3>
                    <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-2xs text-muted">
                      {s.secretName}
                    </code>
                    <span className="num text-2xs text-faint">
                      {s.publishedLimit}
                    </span>
                  </div>
                  <p className="mb-3 text-2xs leading-relaxed text-muted">
                    {s.serves}
                  </p>

                  <ol className="mb-3 flex flex-col gap-1">
                    {(s.steps ?? []).map((step, i) => (
                      <li
                        key={step}
                        className="flex gap-2 text-2xs leading-relaxed text-muted"
                      >
                        <span className="num shrink-0 text-faint">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="flex flex-wrap gap-2">
                    {s.registerUrl ? (
                      <a
                        href={s.registerUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded bg-accent px-3 py-1.5 text-2xs font-medium text-black transition-opacity hover:opacity-90"
                      >
                        {zh ? "去注册" : "Register"} ↗
                      </a>
                    ) : null}
                    {s.docsUrl ? (
                      <a
                        href={s.docsUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded border border-border px-3 py-1.5 text-2xs text-muted transition-colors hover:text-fg"
                      >
                        {zh ? "文档" : "Docs"} ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title={zh ? "已连接" : "Connected"}
          subtitle={zh ? "免费、无需 key、生产在跑" : "free, key-free, in production"}
        >
          <ul className="flex flex-col divide-y divide-border">
            {[...connected, ...arrived].map((s) => (
              <li key={s.id} className="flex flex-col gap-1 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                  <span className="text-sm text-fg">{s.name}</span>
                  {s.keyPresent ? (
                    <Badge tone="positive">{zh ? "key 已设" : "key set"}</Badge>
                  ) : null}
                </div>
                <p className="text-2xs leading-relaxed text-muted">{s.serves}</p>
                <p className="text-2xs text-faint">
                  {s.publishedLimit} · {actualRate(s.minIntervalMs, zh)}
                </p>
              </li>
            ))}
          </ul>
        </ChartContainer>

        <ChartContainer
          title={zh ? "已否决" : "Rejected"}
          subtitle={
            zh ? "记录原因，避免重复踩坑" : "reason recorded so nobody re-adds it"
          }
        >
          {rejected.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {zh ? "暂无" : "None"}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {rejected.map((s) => (
                <li
                  key={s.id}
                  className="rounded border border-border-soft bg-surface-3 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                    <span className="text-sm text-fg line-through decoration-faint">
                      {s.name}
                    </span>
                  </div>
                  <p className="text-2xs leading-relaxed text-muted">
                    {s.rejectedReason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ChartContainer>
      </div>

      <p className={cn("mt-4 text-2xs leading-relaxed text-faint")}>
        {zh
          ? "限流按各家公布的上限执行，并刻意留出余量 —— 例如 SEC EDGAR 公布 10 次/秒且超限直接封 IP，Atlas 按 6.7 次/秒调用。不同源之间互不阻塞。"
          : "Throttling follows each provider's published ceiling with deliberate headroom — SEC EDGAR publishes 10/s and enforces it by banning the IP, so Atlas calls at 6.7/s. Sources never block one another."}
      </p>
    </DataState>
  );
}
