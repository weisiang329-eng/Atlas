import type { IndustryPrimerData } from "@/lib/mock/industry-primer";

/** Industry primer — "what is this, key terms, who's in it" above the value chain/compare sections. */
export function IndustryPrimer({ data }: { data: IndustryPrimerData }) {
  return (
    <div className="mb-6 flex flex-col gap-5 rounded-panel border border-border bg-surface p-5 shadow-panel">
      <div>
        <span className="eyebrow">这个行业是什么</span>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg">{data.what}</p>
      </div>

      <div>
        <span className="eyebrow">关键术语 Glossary</span>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          {data.glossary.map((g) => (
            <div key={g.term} className="rounded border border-border-soft bg-surface-3 p-3">
              <dt className="text-sm font-medium text-fg">
                {g.term} <span className="text-faint">· {g.zh}</span>
              </dt>
              <dd className="mt-1 text-2xs leading-relaxed text-muted">{g.def}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <span className="eyebrow">行业内公司 Who&apos;s in it</span>
        <ul className="mt-2 flex flex-col divide-y divide-border">
          {data.roster.map((r) => (
            <li key={r.ticker} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="w-40 shrink-0 font-mono text-sm font-semibold text-fg">{r.ticker}</span>
              <span className="w-56 shrink-0 text-2xs text-faint">{r.subIndustry}</span>
              <span className="text-sm text-muted">{r.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
