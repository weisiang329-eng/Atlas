"use client";

/**
 * Subject selector — the Financials workspace header control. Live mode shows
 * a native select over the coverage universe (fast, accessible, no overlay
 * plumbing); sample mode shows the fixed sample subject with its badge.
 */
import { Badge } from "@/components/ui/badge";
import { useFinancialSubject } from "./subject-context";

export function SubjectSelector() {
  const { subject, companies, setSubjectId, isSample } = useFinancialSubject();

  return (
    <div className="flex items-center gap-2 rounded border border-border bg-surface px-3 py-2">
      <span className="text-2xs uppercase tracking-wide text-faint">
        Subject
      </span>
      {isSample ? (
        <>
          <span className="text-sm font-medium text-fg">{subject.name}</span>
          <span className="font-mono text-2xs text-muted">{subject.ticker}</span>
          <Badge tone="accent">Mock</Badge>
        </>
      ) : (
        <>
          <label className="sr-only" htmlFor="financial-subject">
            Analysis subject
          </label>
          <select
            id="financial-subject"
            value={subject.id}
            onChange={(e) => setSubjectId(e.target.value)}
            className="bg-transparent text-sm font-medium text-fg outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.ticker})
              </option>
            ))}
          </select>
          <Badge tone="accent">Live</Badge>
        </>
      )}
    </div>
  );
}
