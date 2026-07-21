"use client";

/**
 * Atlas Score chip for the company header — a compact live read of the
 * company's score so the header matches the overview. Silent until resolved.
 */
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import type { ScoreResult } from "@/lib/types";

export function HeaderScore({ companyId }: { companyId: string }) {
  const r = useApiResource<ScoreResult>(
    isApiConfigured() ? `/v1/companies/${companyId}/score` : null,
  );
  const s = r.data;
  const value =
    s?.atlasScore === null || s?.atlasScore === undefined ? "—" : String(s.atlasScore);
  return (
    <span className="num text-sm text-fg">
      {value}
      {s?.grade && s.grade !== "—" ? (
        <span className="ml-1 text-faint">{s.grade}</span>
      ) : null}
    </span>
  );
}
