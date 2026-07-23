"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { KIND_LABEL, KIND_TONE, type Relation, type RelationKind } from "@/lib/mock/graph";

/** English labels mirroring KIND_LABEL (which holds the zh strings). */
const KIND_LABEL_EN: Record<RelationKind, string> = {
  supplier: "Supplier",
  customer: "Customer",
  competitor: "Competitor",
  shareholder: "Shareholder",
  partner: "Partner",
};

/**
 * Relationship panel — grouped-by-kind list. Drop into a company overview
 * page ("关系" panel per P007 spec) or the /knowledge index. v2 adds the
 * node/edge graph visualization (reuse components/viz/relationship-graph.tsx)
 * — not built here since its real prop contract wasn't read from the repo.
 */
export function RelationsPanel({ ticker, relations }: { ticker: string; relations: Relation[] }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const groups = new Map<string, Relation[]>();
  for (const r of relations) {
    const key = r.kind;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  if (relations.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-border px-6 py-10 text-center">
        <p className="text-sm text-muted">
          {zh ? "该公司暂无已录入关系。" : "No relationships recorded for this company."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([kind, rows]) => (
        <div key={kind}>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={KIND_TONE[kind as Relation["kind"]]}>
              {zh ? KIND_LABEL[kind as Relation["kind"]] : KIND_LABEL_EN[kind as Relation["kind"]]}
            </Badge>
            <span className="text-2xs text-faint">
              {rows.length} {zh ? "条" : rows.length === 1 ? "item" : "items"}
            </span>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((r, i) => {
              const other = r.from === ticker ? r.to : r.from;
              return (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="font-mono text-sm font-semibold text-fg">{other}</span>
                  <span className="flex-1 text-sm text-muted">{r.note}</span>
                  <span className="text-2xs text-faint">{zh ? "置信" : "Confidence"} {r.confidence}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
