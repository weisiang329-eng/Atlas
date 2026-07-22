/**
 * Industry intelligence presenters (P006 / P026 Phase 2).
 *
 * Shapes an industry's metric rows into named series with derived cycle
 * signals: latest value, year-over-year change, and — where both an output
 * price and an input cost exist — a spread series (the margin proxy that
 * drives the whole sector's earnings cycle). Computation lives here, never
 * in the UI.
 */
import type { IndustryMetric } from "../db/schema.ts";

export interface SeriesPointDto {
  date: string;
  value: number;
  note?: string;
}

export interface MetricSeriesDto {
  key: string;
  label: string;
  kind: string;
  unit: string;
  points: SeriesPointDto[];
  latest: number | null;
  latestDate: string | null;
  changeYoYPct: number | null;
}

export interface CycleSignalDto {
  label: string;
  /** e.g. "ASP − cost spread", indexed or absolute per the note. */
  unit: string;
  points: SeriesPointDto[];
  latest: number | null;
  changeYoYPct: number | null;
}

export interface IndustryDetailDto {
  id: string;
  name: string;
  sector: string;
  description: string | null;
  companies: {
    id: string;
    name: string;
    ticker: string;
    exchange: string;
    segment: string;
    country: string;
  }[];
  series: MetricSeriesDto[];
  cycleSignal: CycleSignalDto | null;
}

/** Value ~one year before the latest point (nearest by date within a window). */
function priorYear(points: SeriesPointDto[]): number | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1]!;
  const target = new Date(latest.date).getTime() - 365 * 86_400_000;
  let best: SeriesPointDto | null = null;
  let bestGap = Infinity;
  for (const p of points) {
    const gap = Math.abs(new Date(p.date).getTime() - target);
    if (gap < bestGap && gap < 100 * 86_400_000) {
      best = p;
      bestGap = gap;
    }
  }
  return best?.value ?? null;
}

function yoy(points: SeriesPointDto[]): number | null {
  const latest = points[points.length - 1]?.value;
  const prev = priorYear(points);
  if (latest === undefined || prev === null || prev === 0) return null;
  return Number((((latest - prev) / prev) * 100).toFixed(1));
}

export function buildMetricSeries(rows: IndustryMetric[]): MetricSeriesDto[] {
  const byKey = new Map<string, IndustryMetric[]>();
  for (const r of rows) {
    const g = byKey.get(r.metricKey) ?? [];
    g.push(r);
    byKey.set(r.metricKey, g);
  }
  const out: MetricSeriesDto[] = [];
  for (const [key, group] of byKey) {
    const points: SeriesPointDto[] = group.map((r) => ({
      date: r.observationDate,
      value: r.value,
      ...(r.note ? { note: r.note } : {}),
    }));
    const last = points[points.length - 1];
    out.push({
      key,
      label: group[0]!.label,
      kind: group[0]!.kind,
      unit: group[0]!.unit,
      points,
      latest: last?.value ?? null,
      latestDate: last?.date ?? null,
      changeYoYPct: yoy(points),
    });
  }
  return out;
}

/**
 * Cycle signal — the output-price ÷ input-cost ratio, indexed to its own
 * earliest common quarter (=100). Rising = margins expanding. Only produced
 * when the industry has one 'price' and one 'cost' series that overlap.
 */
export function buildCycleSignal(
  series: MetricSeriesDto[],
): CycleSignalDto | null {
  const price = series.find((s) => s.kind === "price");
  const cost = series.find((s) => s.kind === "cost");
  if (!price || !cost) return null;

  const costByDate = new Map(cost.points.map((p) => [p.date, p.value]));
  const paired = price.points
    .filter((p) => costByDate.has(p.date) && costByDate.get(p.date)! > 0)
    .map((p) => ({ date: p.date, ratio: p.value / costByDate.get(p.date)! }));
  if (paired.length < 2) return null;

  const base = paired[0]!.ratio;
  const points: SeriesPointDto[] = paired.map((p) => ({
    date: p.date,
    value: Number(((p.ratio / base) * 100).toFixed(1)),
  }));
  const last = points[points.length - 1]!;
  return {
    label: `${price.label} ÷ ${cost.label} (indexed, ${paired[0]!.date.slice(0, 7)} = 100)`,
    unit: "index",
    points,
    latest: last.value,
    changeYoYPct: yoy(points),
  };
}
