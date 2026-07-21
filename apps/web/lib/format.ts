/**
 * Atlas number/date/currency formatting — single source of truth.
 * Spec: docs/design/00-data-conventions.md. Every number/date in the UI goes
 * through one of these — no inline toLocaleString()/toLocaleDateString().
 *
 * Numeric glyph rule: render formatted output inside the `.num` utility class
 * (Plex Sans + tabular-nums, plain zero) — these functions return strings only.
 */

export function formatNumber(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString("en-US");
  return v < 0 ? `(${formatted})` : formatted;
}

export function formatCurrency(
  v: number | null | undefined,
  ccy: string = "USD",
): string {
  if (v === null || v === undefined) return "—";
  const symbol = ccy === "USD" ? "$" : "";
  const body = formatNumber(v);
  if (symbol) {
    // Keep the sign/parenthesis outside the symbol: ($1,200) not $(1,200).
    return v < 0 ? `(${symbol}${formatNumber(Math.abs(v)).replace(/[()]/g, "")})` : `${symbol}${body}`;
  }
  return `${body} ${ccy}`;
}

export function formatPercent(
  v: number | null | undefined,
  decimals: number = 2,
): string {
  if (v === null || v === undefined) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(decimals)}%`;
}

export function formatMultiple(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(2)}x`;
}

/** KPI tiles only — never in table cells (tables show full figures). */
export function formatCompact(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/** ISO date — unambiguous across US + Malaysian subjects. */
export function formatDate(d: string | number | Date | null | undefined): string {
  if (d === null || d === undefined) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(
  d: string | number | Date | null | undefined,
  opts?: { tz?: string },
): string {
  if (d === null || d === undefined) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const iso = formatDate(date);
  const time = date.toTimeString().slice(0, 8);
  return opts?.tz ? `${time} ${opts.tz}` : `${iso} ${time}`;
}

export function formatRelative(d: string | number | Date | null | undefined): string {
  if (d === null || d === undefined) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} 小时前`;
  return formatDate(date);
}
