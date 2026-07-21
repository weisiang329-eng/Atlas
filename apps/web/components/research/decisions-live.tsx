"use client";

/**
 * Decision journal (P008) — record a decision, its rationale and conviction,
 * optionally tagged to a company, so judgements can be reviewed against
 * outcomes later (feeds P023 learning). Local to the browser.
 */
import { useState } from "react";
import Link from "next/link";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useDecisions, type Decision } from "@/lib/loaders/use-research";
import { STATIC_UNIVERSE, getStaticCompany } from "@/lib/universe";
import { fmtDate } from "@/lib/format";

const convictionTone = (c: Decision["conviction"]): "positive" | "warning" | "neutral" =>
  c === "high" ? "positive" : c === "medium" ? "warning" : "neutral";

export function DecisionsLive() {
  const { items, add, remove } = useDecisions();
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [conviction, setConviction] = useState<Decision["conviction"]>("medium");
  const [companyId, setCompanyId] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader eyebrow="New" title="Log a decision" />
        <PanelBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!decision.trim()) return;
              add({
                decision: decision.trim(),
                rationale: rationale.trim(),
                conviction,
                companyId: companyId || undefined,
                date: new Date().toISOString(),
              });
              setDecision("");
              setRationale("");
              setConviction("medium");
              setCompanyId("");
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap gap-3">
              <input
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="The decision (e.g. 'Add to NVDA', 'Avoid gloves')"
                className="flex-1 rounded border border-border-soft bg-surface-3 px-3 py-2 text-sm text-fg outline-none focus:border-accent-dim"
              />
              <select
                value={conviction}
                onChange={(e) => setConviction(e.target.value as Decision["conviction"])}
                className="rounded border border-border-soft bg-surface-3 px-2 py-2 text-sm text-fg outline-none"
              >
                <option value="low">Low conviction</option>
                <option value="medium">Medium conviction</option>
                <option value="high">High conviction</option>
              </select>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="rounded border border-border-soft bg-surface-3 px-2 py-2 text-sm text-fg outline-none"
              >
                <option value="">No company</option>
                {STATIC_UNIVERSE.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ticker} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why? What has to be true for this to be right?"
              rows={3}
              className="rounded border border-border-soft bg-surface-3 px-3 py-2 text-sm text-fg outline-none focus:border-accent-dim"
            />
            <div>
              <button type="submit" className="rounded border border-accent-dim bg-surface-2 px-4 py-2 text-sm text-accent">
                Log decision
              </button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      {items.length === 0 ? (
        <EmptyState title="No decisions logged" body="Record decisions and their rationale to review against outcomes later." />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((d) => {
            const co = d.companyId ? getStaticCompany(d.companyId) : undefined;
            return (
              <Panel key={d.id}>
                <PanelBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-base font-semibold text-fg">{d.decision}</h3>
                        <Badge tone={convictionTone(d.conviction)}>{d.conviction} conviction</Badge>
                        {co ? (
                          <Link href={`/companies/${co.id}/overview`}>
                            <Badge tone="accent">{co.ticker}</Badge>
                          </Link>
                        ) : null}
                      </div>
                      {d.rationale ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{d.rationale}</p> : null}
                      <p className="mt-2 text-2xs text-faint">{fmtDate(d.date)}</p>
                    </div>
                    <button type="button" onClick={() => remove(d.id)} className="text-faint hover:text-negative" aria-label="Delete decision">
                      ✕
                    </button>
                  </div>
                </PanelBody>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
