"use client";

/**
 * Research notes (P008) — write and keep working notes, optionally tagged to a
 * covered company. Local to the browser. Newest first.
 */
import { useState } from "react";
import Link from "next/link";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useNotes } from "@/lib/loaders/use-research";
import { STATIC_UNIVERSE, getStaticCompany } from "@/lib/universe";
import { useLocale } from "@/lib/i18n/use-locale";
import { fmtDate } from "@/lib/format";

export function NotesLive() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { items, add, remove } = useNotes();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [companyId, setCompanyId] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader eyebrow={zh ? "新建" : "New"} title={zh ? "写笔记" : "Write a note"} />
        <PanelBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              add({
                title: title.trim(),
                body: body.trim(),
                companyId: companyId || undefined,
                createdAt: new Date().toISOString(),
              });
              setTitle("");
              setBody("");
              setCompanyId("");
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={zh ? "笔记标题" : "Note title"}
                className="flex-1 rounded border border-border-soft bg-surface-3 px-3 py-2 text-sm text-fg outline-none focus:border-accent-dim"
              />
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="rounded border border-border-soft bg-surface-3 px-2 py-2 text-sm text-fg outline-none"
              >
                <option value="">{zh ? "不关联公司" : "No company"}</option>
                {STATIC_UNIVERSE.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ticker} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={zh ? "你观察到了什么？它意味着什么？" : "What did you observe, and what does it imply?"}
              rows={3}
              className="rounded border border-border-soft bg-surface-3 px-3 py-2 text-sm text-fg outline-none focus:border-accent-dim"
            />
            <div>
              <button type="submit" className="rounded border border-accent-dim bg-surface-2 px-4 py-2 text-sm text-accent">
                {zh ? "保存笔记" : "Save note"}
              </button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      {items.length === 0 ? (
        <EmptyState title={zh ? "暂无笔记" : "No notes yet"} body={zh ? "你的研究笔记保存在本浏览器本地。" : "Your research notes are stored locally in this browser."} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => {
            const co = n.companyId ? getStaticCompany(n.companyId) : undefined;
            return (
              <Panel key={n.id}>
                <PanelBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-base font-semibold text-fg">{n.title}</h3>
                        {co ? (
                          <Link href={`/companies/${co.id}/overview`}>
                            <Badge tone="accent">{co.ticker}</Badge>
                          </Link>
                        ) : null}
                      </div>
                      {n.body ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{n.body}</p> : null}
                      <p className="mt-2 text-2xs text-faint">{fmtDate(n.createdAt)}</p>
                    </div>
                    <button type="button" onClick={() => remove(n.id)} className="text-faint hover:text-negative" aria-label={zh ? "删除笔记" : "Delete note"}>
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
