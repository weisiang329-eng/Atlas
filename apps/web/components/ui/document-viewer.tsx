"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export interface DocItem {
  id: string;
  title: string;
  type: string;
  date: string;
  source: string;
  pages?: number;
}

/**
 * Reusable two-pane document viewer: a selectable document list and a preview
 * pane. The preview is a placeholder until a document/storage backend exists —
 * the layout and interaction are the deliverable here, not rendering.
 */
export function DocumentViewer({ documents }: { documents: DocItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    documents[0]?.id ?? null,
  );
  const selected = documents.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <ul
        className="flex max-h-[28rem] flex-col overflow-y-auto rounded-panel border border-border bg-surface"
        aria-label="Documents"
      >
        {documents.map((doc) => {
          const active = doc.id === selectedId;
          return (
            <li key={doc.id} className="border-b border-border last:border-0">
              <button
                type="button"
                onClick={() => setSelectedId(doc.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col items-start gap-1 px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
                  active ? "bg-surface-2" : "hover:bg-surface-2/60",
                )}
              >
                <span className="line-clamp-1 text-sm font-medium text-fg">
                  {doc.title}
                </span>
                <span className="font-mono text-2xs text-faint">
                  {doc.type} · {doc.date}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex min-h-[24rem] flex-col rounded-panel border border-border bg-surface">
        {selected ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate font-serif text-base text-fg">
                  {selected.title}
                </h3>
                <p className="mt-0.5 font-mono text-2xs text-faint">
                  {selected.source} · {selected.type} · {selected.date}
                  {selected.pages ? ` · ${selected.pages}p` : ""}
                </p>
              </div>
              <Badge tone="accent">Mock</Badge>
            </header>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded border border-border font-mono text-sm text-faint">
                {selected.type.slice(0, 3).toUpperCase()}
              </span>
              <p className="text-sm text-muted">
                Preview will render here once a document backend is connected.
              </p>
              <p className="max-w-sm text-2xs text-faint">
                The viewer shell, list, selection and metadata are ready; only
                the rendering surface waits on a storage contract.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
            No document selected.
          </div>
        )}
      </div>
    </div>
  );
}
