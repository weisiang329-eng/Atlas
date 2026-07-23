"use client";

/**
 * Research overview (P008) — counts and recent notes/decisions, links into the
 * sub-workspaces. Local data.
 */
import Link from "next/link";
import { StatGrid } from "@/components/ui/stat-grid";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useNotes, useDecisions } from "@/lib/loaders/use-research";
import { getStaticCompany } from "@/lib/universe";
import { useLocale } from "@/lib/i18n/use-locale";

export function ResearchOverview() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { items: notes } = useNotes();
  const { items: decisions } = useDecisions();
  const highConviction = decisions.filter((d) => d.conviction === "high").length;
  const convictionLabel = (c: "low" | "medium" | "high"): string =>
    zh ? (c === "high" ? "高" : c === "medium" ? "中" : "低") : c;

  return (
    <div className="flex flex-col gap-6">
      <StatGrid
        items={[
          { label: zh ? "笔记" : "Notes", value: String(notes.length) },
          { label: zh ? "决策" : "Decisions", value: String(decisions.length) },
          { label: zh ? "高信念" : "High conviction", value: String(highConviction) },
          { label: zh ? "关联公司" : "Tagged companies", value: String(new Set([...notes, ...decisions].map((x) => x.companyId).filter(Boolean)).size) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            eyebrow={zh ? "笔记" : "Notes"}
            title={zh ? "近期笔记" : "Recent notes"}
            action={<Link href="/research/notes" className="font-mono text-2xs uppercase tracking-wide text-accent">{zh ? "全部" : "All"} &rarr;</Link>}
          />
          <PanelBody className="p-0">
            {notes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">{zh ? "暂无笔记。" : "No notes yet."}</p>
            ) : (
              <ul className="divide-y divide-border">
                {notes.slice(0, 5).map((n) => {
                  const co = n.companyId ? getStaticCompany(n.companyId) : undefined;
                  return (
                    <li key={n.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <span className="truncate text-sm text-fg">{n.title}</span>
                      {co ? <Badge tone="accent">{co.ticker}</Badge> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow={zh ? "决策" : "Decisions"}
            title={zh ? "近期决策" : "Recent decisions"}
            action={<Link href="/research/decision-journal" className="font-mono text-2xs uppercase tracking-wide text-accent">{zh ? "全部" : "All"} &rarr;</Link>}
          />
          <PanelBody className="p-0">
            {decisions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">{zh ? "暂无决策。" : "No decisions yet."}</p>
            ) : (
              <ul className="divide-y divide-border">
                {decisions.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <span className="truncate text-sm text-fg">{d.decision}</span>
                    <Badge tone={d.conviction === "high" ? "positive" : d.conviction === "medium" ? "warning" : "neutral"}>
                      {convictionLabel(d.conviction)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
