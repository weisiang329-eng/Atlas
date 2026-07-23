"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";

interface PlannedModuleProps {
  /** What this module will show once its data lands. */
  title: string;
  /** One or two sentences on the analytical purpose. */
  body: string;
  /** The fields/shape the module will render — the intended contract. */
  fields?: string[];
  /** What has to exist before this can be built (table, feed, key, program). */
  requires: string;
  /** Programme reference, e.g. "P005 v2". */
  program?: string;
}

/**
 * The honest state for a module whose data does not exist yet.
 *
 * Atlas's first rule is that no figure is ever invented for a real company, so
 * these pages must not show a fabricated table. Instead this states the
 * module's purpose, the shape it will take, and precisely what unblocks it —
 * which is more useful to a reader than a skeleton pretending to be data.
 */
export function PlannedModule({
  title,
  body,
  fields,
  requires,
  program,
}: PlannedModuleProps) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  return (
    <div className="rounded-panel border border-dashed border-border bg-surface-3 px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{zh ? "待数据" : "Awaiting data"}</Badge>
          {program ? <Badge tone="accent">{program}</Badge> : null}
        </div>
        <h3 className="font-serif text-lg text-fg">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
      </div>

      {fields?.length ? (
        <div className="mx-auto mt-7 max-w-xl">
          <p className="mb-2 font-mono text-2xs uppercase tracking-[0.08em] text-faint">
            {zh ? "将呈现" : "Will render"}
          </p>
          <ul className="flex flex-wrap justify-center gap-1.5">
            {fields.map((f) => (
              <li
                key={f}
                className="rounded-pill border border-border-soft bg-surface px-2.5 py-1 font-mono text-2xs text-muted"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mx-auto mt-7 max-w-xl rounded border border-border-soft bg-surface px-4 py-3">
        <p className="mb-1 font-mono text-2xs uppercase tracking-[0.08em] text-faint">
          {zh ? "阻塞于" : "Blocked on"}
        </p>
        <p className="text-sm text-fg">{requires}</p>
      </div>

      <p className="mx-auto mt-5 max-w-xl text-center text-2xs text-faint">
        {zh
          ? "Atlas 绝不为真实公司编造数字 —— 在有来源数据前，此模块保持空白。"
          : "Atlas never fabricates figures for a real company — this module stays empty until sourced data exists."}
      </p>
    </div>
  );
}
