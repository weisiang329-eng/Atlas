/**
 * The sourced-write layer — P1 of the autonomous Industry agent
 * (adr/ADR-Autonomous-Industry-Agent.md).
 *
 * The platform's first rule (convention #1) is that no value is ever invented
 * for a real entity. When an AGENT proposes a Tier-A write — one meant to be
 * *transcribed* from a primary source — a PROMPT that says "don't make it up" is
 * not a guarantee. This module makes the guarantee STRUCTURAL: a Tier-A metric
 * write is rejected unless the value actually appears in content the caller
 * fetched from an allowed (free, reachable, never-paid) source. No fetch → no
 * receipt → no matching value → no write.
 *
 * Everything here except `fetchForWrite` is pure, so the guard is unit-tested
 * directly (seed/test-agent-writes.mjs).
 *
 * HONEST SCOPE BOUNDARY. This guarantees the value EXISTS in the fetched source.
 * It does NOT guarantee the value is the RIGHT one for the metric — a source
 * page holds many numbers. Semantic correctness ("is this really the ASP, not
 * some other figure on the page") is a Tier-B / human-review concern (P2), which
 * this deliberately does not pretend to settle. What it kills dead is pure
 * hallucination: a number the model generated that is nowhere in any fetched
 * source can never reach a live table.
 */
import { SOURCE_BY_ID, politeFetch } from "../ingest/sources.ts";

export class FabricationGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FabricationGuardError";
  }
}

/**
 * Sources the agent may transcribe FROM: free and Worker-reachable. `connected`
 * is proven-reachable-free; `awaiting-key` is free once the owner adds the key
 * (the fetch will fail without it, but the source is permitted). Everything else
 * is excluded on purpose: `paid` (convention #8), `rejected`, `derived` (not an
 * external source — it has its own deterministic path), and `unverified` (not
 * probed from the Worker, so not yet trusted).
 */
export function isWritableSource(sourceId: string): boolean {
  const s = SOURCE_BY_ID.get(sourceId);
  return !!s && (s.status === "connected" || s.status === "awaiting-key");
}

/** Proof that a fetch happened, carried from `fetchForWrite` to the write. */
export interface FetchReceipt {
  sourceId: string;
  /** `source.kind` vocabulary, e.g. 'sec-edgar', 'fred'. */
  kind: string;
  url: string;
  /** ISO timestamp the content was retrieved. */
  retrievedAt: string;
}

/**
 * Every number a source page actually contains, normalised so formatting does
 * not matter (`1,234.5` and `1234.5` are the same number).
 */
export function numbersIn(content: string): number[] {
  const out: number[] = [];
  for (const m of content.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/,/g, ""));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/**
 * The guard: does the fetched content actually support this value? True iff the
 * value appears as a number token in the source, up to formatting and float
 * rounding.
 */
export function contentSupports(content: string, value: number): boolean {
  return numbersIn(content).some(
    (n) =>
      Math.abs(n - value) < 1e-6 ||
      (value !== 0 && Math.abs(n - value) / Math.abs(value) < 1e-9),
  );
}

export interface MetricWriteInput {
  receipt: FetchReceipt;
  /** The exact content fetched under `receipt` — the evidence the guard checks. */
  content: string;
  industryId: string;
  metricKey: string;
  label: string;
  /** Metric kind: 'price' | 'cost' | 'capacity' | 'utilisation'. */
  kind: string;
  unit: string;
  /** ISO observation date. */
  observationDate: string;
  value: number;
}

export interface SourcedMetricWrite {
  source: {
    id: string;
    kind: string;
    name: string;
    url: string | null;
    retrievedAt: string;
    note: string;
  };
  metric: {
    industryId: string;
    metricKey: string;
    label: string;
    kind: string;
    observationDate: string;
    value: number;
    unit: string;
    sourceId: string;
  };
}

/**
 * Turn an agent's Tier-A metric proposal into the `source` + `industry_metric`
 * rows to insert — or throw. The value MUST appear in the fetched content, and
 * the receipt's source MUST be writable (free, reachable, never paid). Callers
 * insert the returned rows in one transaction; the `industry_metric` unique
 * index on (industry, key, date) makes re-runs idempotent.
 */
export function metricWriteFromReceipt(
  input: MetricWriteInput,
): SourcedMetricWrite {
  if (!isWritableSource(input.receipt.sourceId)) {
    throw new FabricationGuardError(
      `source '${input.receipt.sourceId}' is not a writable free source — refusing the write`,
    );
  }
  if (!contentSupports(input.content, input.value)) {
    throw new FabricationGuardError(
      `value ${input.value} does not appear in the fetched '${input.receipt.sourceId}' content — refusing to write an unsourced number`,
    );
  }
  const sourceRow = {
    id: `agent:${input.receipt.sourceId}:${input.industryId}:${input.metricKey}:${input.observationDate}`,
    kind: input.receipt.kind,
    name: SOURCE_BY_ID.get(input.receipt.sourceId)?.name ?? input.receipt.sourceId,
    url: input.receipt.url || null,
    retrievedAt: input.receipt.retrievedAt,
    note: "Transcribed by the Industry agent (Tier A) and verified against fetched content.",
  };
  return {
    source: sourceRow,
    metric: {
      industryId: input.industryId,
      metricKey: input.metricKey,
      label: input.label,
      kind: input.kind,
      observationDate: input.observationDate,
      value: input.value,
      unit: input.unit,
      sourceId: sourceRow.id,
    },
  };
}

/**
 * Fetch content the agent may then transcribe from. The ONLY sanctioned way to
 * obtain external data for a write: it refuses any source not on the writable
 * allowlist, so a paid or unverified URL cannot become a receipt. Requires
 * network — not exercised by the offline test suite; the pure guard above is.
 */
export async function fetchForWrite(
  sourceId: string,
  url: string,
  retrievedAt: string,
  fetcher: typeof politeFetch = politeFetch,
): Promise<{ content: string; receipt: FetchReceipt }> {
  if (!isWritableSource(sourceId)) {
    throw new FabricationGuardError(
      `refusing to fetch-for-write from '${sourceId}': not a writable free source`,
    );
  }
  const res = await fetcher(sourceId, url);
  if (!res.ok) {
    throw new Error(`fetch-for-write ${sourceId} returned ${res.status}`);
  }
  const content = await res.text();
  return { content, receipt: { sourceId, kind: sourceId, url, retrievedAt } };
}
