"use client";

/**
 * Live relationship graph (P007). A subject company at the centre, its
 * suppliers / customers / competitors around it, plus a text relations panel.
 * Live from /v1/graph/company/:id; no sample fallback (the graph is only
 * meaningful with real edges), so shows guidance when the API is unconfigured.
 */
import { useState } from "react";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataState } from "@/components/ui/data-state";
import { ChartContainer } from "@/components/chart/chart-container";
import { RelationshipGraph } from "@/components/viz/relationship-graph";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { ready } from "@/lib/resource";
import { STATIC_UNIVERSE } from "@/lib/universe";
import type { CompanySummary } from "@/lib/types";

interface EgoGraph {
  subject: { id: string; name: string };
  nodes: { id: string; label: string; kind: "company" | "supplier" | "customer" | "competitor" | "sector" }[];
  edges: { from: string; to: string; label?: string }[];
  relations: {
    id: string;
    name: string;
    kind: string;
    relation: string;
    label: string | null;
    note: string | null;
  }[];
}

const relTone = (kind: string): "info" | "positive" | "warning" | "neutral" => {
  if (kind === "supplier") return "info";
  if (kind === "customer") return "positive";
  if (kind === "competitor") return "warning";
  return "neutral";
};

export function GraphLive({
  initialSubject = "nvidia",
  lockSubject = false,
}: {
  initialSubject?: string;
  /** When true, render the fixed subject's graph with no company selector. */
  lockSubject?: boolean;
}) {
  const live = isApiConfigured();
  const companiesR = useApiResource<CompanySummary[]>(
    live && !lockSubject ? "/v1/companies" : null,
    ready(STATIC_UNIVERSE),
  );
  const companies = companiesR.data ?? STATIC_UNIVERSE;
  const [subject, setSubject] = useState(initialSubject);
  const r = useApiResource<EgoGraph>(live ? `/v1/graph/company/${subject}` : null);

  if (!live) {
    return (
      <EmptyState
        title="API not configured"
        body="Set NEXT_PUBLIC_API_BASE_URL at build time to load the live relationship graph."
      />
    );
  }

  const g = r.data;

  return (
    <>
      {lockSubject ? null : (
        <div className="mb-4 flex items-center gap-2 rounded border border-border bg-surface px-3 py-2">
          <span className="text-2xs uppercase tracking-wide text-faint">Subject</span>
          <label className="sr-only" htmlFor="graph-subject">Graph subject</label>
          <select
            id="graph-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-transparent text-sm font-medium text-fg outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.ticker})
              </option>
            ))}
          </select>
        </div>
      )}

      <DataState
        status={r.status}
        empty={<EmptyState title="No relationships mapped" body="This company has no graph edges yet." />}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartContainer
              title="Relationship graph"
              subtitle={g ? `${g.subject.name} · suppliers, customers, competitors` : "—"}
              height={380}
              footer="Source-linked industry structure"
            >
              {g && g.nodes.length > 1 ? (
                <RelationshipGraph
                  nodes={g.nodes}
                  edges={g.edges}
                  ariaLabel={`Relationship graph for ${g.subject.name}`}
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted">
                  No mapped relationships.
                </div>
              )}
            </ChartContainer>
          </div>

          <Panel>
            <PanelBody className="p-0">
              <dl className="divide-y divide-border">
                {(g?.relations ?? []).map((rel) => (
                  <div key={`${rel.id}-${rel.relation}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-fg">{rel.name}</span>
                      <Badge tone={relTone(rel.kind)}>{rel.relation}</Badge>
                    </div>
                    {rel.note ? (
                      <p className="mt-1 text-xs text-muted">{rel.note}</p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </PanelBody>
          </Panel>
        </div>
      </DataState>
    </>
  );
}
