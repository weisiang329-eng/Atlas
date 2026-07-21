"use client";

/**
 * Value-chain view (P006). Renders the AI-hardware stack as ordered stages
 * (upstream → downstream) with each stage's companies, and lists the real
 * supply links between stages. Live from /v1/industries/value-chain.
 */
import Link from "next/link";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type { ValueChain } from "@/lib/types";

export function ValueChainLive() {
  const live = isApiConfigured();
  const r = useApiResource<ValueChain>(live ? "/v1/industries/value-chain" : null);

  if (!live) {
    return (
      <EmptyState
        title="API not configured"
        body="Set NEXT_PUBLIC_API_BASE_URL at build time to load the value chain."
      />
    );
  }

  const chain = r.data;
  const edgeCount = (industryId: string) =>
    (chain?.edges ?? []).filter((e) => e.fromStage === industryId).length;

  return (
    <DataState status={r.status}>
      {chain ? (
        <>
          <p className="mb-4 text-sm text-muted">
            The AI-hardware stack, upstream to downstream. Arrows below are real
            supply relationships between covered companies.
          </p>

          <div className="flex flex-col gap-3">
            {chain.stages.map((stage, i) => (
              <div key={stage.industryId} className="flex items-stretch gap-3">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <span className="num grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-xs text-muted">
                    {stage.order}
                  </span>
                  {i < chain.stages.length - 1 ? (
                    <span className="my-1 w-px flex-1 bg-border" aria-hidden />
                  ) : null}
                </div>
                <Panel className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                    <div>
                      <p className="eyebrow">{stage.sector}</p>
                      <Link
                        href={`/industries/${stage.industryId}`}
                        className="font-serif text-base font-semibold text-fg hover:text-accent"
                      >
                        {stage.name}
                      </Link>
                    </div>
                    <span className="text-2xs text-faint">
                      {edgeCount(stage.industryId) > 0
                        ? `supplies ${edgeCount(stage.industryId)} downstream`
                        : "downstream stage"}
                    </span>
                  </div>
                  <PanelBody className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {stage.companies.map((co) => (
                        <Link
                          key={co.id}
                          href={`/companies/${co.id}/overview`}
                          className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-sm text-fg transition-colors hover:border-accent-dim"
                        >
                          {co.name}
                          <span className="font-mono text-2xs text-muted">{co.ticker}</span>
                        </Link>
                      ))}
                      {stage.companies.length === 0 ? (
                        <span className="text-sm text-faint">No covered companies.</span>
                      ) : null}
                    </div>
                  </PanelBody>
                </Panel>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <PanelHeader eyebrow="Supply links" title="Who supplies whom" />
            <Panel className="mt-3">
              <PanelBody className="p-0">
                <ul className="divide-y divide-border">
                  {chain.edges.map((e, i) => (
                    <li key={i} className="flex items-center gap-2 px-4 py-2 text-sm">
                      <span className="font-mono text-fg">{e.fromCompany}</span>
                      <span className="text-faint">&rarr;</span>
                      <span className="font-mono text-fg">{e.toCompany}</span>
                      {e.label ? <Badge tone="neutral">{e.label}</Badge> : null}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          </div>
        </>
      ) : null}
    </DataState>
  );
}
