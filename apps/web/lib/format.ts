/**
 * The canonical formatting module (docs/DESIGN-SYSTEM.md §3).
 *
 * Every date and every figure in Atlas goes through here. Hand-rolling a
 * format in a component is how a product ends up with four date styles on one
 * screen — the single most common tell of an unfinished financial UI.
 *
 * Two rules encoded here:
 *   1. Missing data is ALWAYS "—". Never 0, never "N/A", never blank.
 *   2. Figures are rendered for `.num` (tabular numerals) — the caller applies
 *      the class, this module guarantees consistent digits and decimals.
 */

/** The em-dash used for every missing value, platform-wide. */
export const MISSING = "—";

type DateInput = string | number | Date | null | undefined;
type Num = number | null | undefined;

function toDate(d: DateInput): Date | null {
  if (d === null || d === undefined || d === "") return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isNum(v: Num): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/* ── Dates ─────────────────────────────────────────────────────────────
 * ISO in tables is deliberate: unambiguous across MY/US/HK conventions,
 * sorts correctly as a string, and every row is the same width — which
 * matters because dates sit in tabular-numeral columns.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-07-21` — tables, data, anything that must sort or align. */
export function fmtDate(d: DateInput): string {
  const date = toDate(d);
  if (!date) return MISSING;
  return date.toISOString().slice(0, 10);
}

/** `21 Jul 2026` — prose, headers, cards. */
export function fmtDateLong(d: DateInput): string {
  const date = toDate(d);
  if (!date) return MISSING;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `2026-07-21 14:32` — timestamps. */
export function fmtDateTime(d: DateInput): string {
  const date = toDate(d);
  if (!date) return MISSING;
  return `${fmtDate(date)} ${date.toISOString().slice(11, 16)}`;
}

/** `Jul 2026` — month grouping. */
export function fmtMonth(d: DateInput): string {
  const date = toDate(d);
  if (!date) return MISSING;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * `2h ago` / `3d ago` — activity feeds only.
 *
 * Locale-aware by parameter rather than a hard-coded language: the previous
 * implementation baked in Chinese strings, which silently broke the English
 * locale. Anything older than a week falls back to an absolute date, because
 * "43d ago" is not information anyone can use.
 */
export function fmtRelative(d: DateInput, locale: "zh" | "en" = "zh"): string {
  const date = toDate(d);
  if (!date) return MISSING;
  const mins = Math.round((Date.now() - date.getTime()) / 60000);

  if (mins < 1) return locale === "zh" ? "刚刚" : "just now";
  if (mins < 60) return locale === "zh" ? `${mins} 分钟前` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return locale === "zh" ? `${hrs} 小时前` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days <= 7) return locale === "zh" ? `${days} 天前` : `${days}d ago`;
  return fmtDate(date);
}

/* ── Numbers ───────────────────────────────────────────────────────── */

/** `1,200` — quantities. Decimals only when asked. */
export function fmtNumber(v: Num, dp = 0): string {
  if (!isNum(v)) return MISSING;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** `12.4500` — prices. Fixed dp so a column aligns on the decimal. */
export function fmtPrice(v: Num, dp = 2): string {
  return fmtNumber(v, dp);
}

/**
 * `RM 3,282.00` — money always states its currency.
 * Atlas is multi-currency; a bare figure is ambiguous by definition.
 */
export function fmtMoney(v: Num, currency: string, dp = 2): string {
  if (!isNum(v)) return MISSING;
  const symbol = currency === "MYR" ? "RM" : currency;
  return `${symbol} ${fmtNumber(v, dp)}`;
}

/** `75.0%` — percentages carry no currency, ever. */
export function fmtPercent(v: Num, dp = 1): string {
  if (!isNum(v)) return MISSING;
  return `${fmtNumber(v, dp)}%`;
}

/** `1.85x` — multiples. */
export function fmtMultiple(v: Num, dp = 2): string {
  if (!isNum(v)) return MISSING;
  return `${fmtNumber(v, dp)}x`;
}

/** `+12.4%` / `−3.1%` — signed change. Pair with `toneOf` for colour. */
export function fmtChange(v: Num, dp = 1, suffix = "%"): string {
  if (!isNum(v)) return MISSING;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${fmtNumber(Math.abs(v), dp)}${suffix}`;
}

/** `1.2M` — only where space genuinely forces it. Never in a statement. */
export function fmtCompact(v: Num, dp = 1): string {
  if (!isNum(v)) return MISSING;
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(dp)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(dp)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(dp)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(dp)}K`;
  return `${sign}${abs.toFixed(dp)}`;
}

/**
 * The tone a figure should be rendered in. Colour carries direction of money
 * and nothing else (DESIGN-SYSTEM §2), so this is the only place that decides.
 */
export function toneOf(v: Num): "positive" | "negative" | "neutral" {
  if (!isNum(v) || v === 0) return "neutral";
  return v > 0 ? "positive" : "negative";
}

/** Tailwind text class for a signed figure. */
export function toneClass(v: Num): string {
  const tone = toneOf(v);
  return tone === "positive"
    ? "text-positive"
    : tone === "negative"
      ? "text-negative"
      : "text-fg";
}

/* ── Back-compat aliases ───────────────────────────────────────────────
 * The original names, kept so existing call sites keep working. New code
 * should use the fmt* names above.
 */
export const formatDate = fmtDate;
export const formatDateTime = fmtDateTime;
export const formatRelative = fmtRelative;
export const formatNumber = (v: Num) => fmtNumber(v, 0);
export const formatPercent = (v: Num, dp = 1) => fmtPercent(v, dp);
export const formatMultiple = (v: Num) => fmtMultiple(v);
export const formatCompact = (v: Num) => fmtCompact(v);
export const formatCurrency = (v: Num, currency = "USD", dp = 2) =>
  fmtMoney(v, currency, dp);
