/**
 * Navigation icons.
 *
 * The sidebar used a two-letter mono monogram per row — HM, LG, PF, WL, MK,
 * NW, CO, FN… Twenty of them stacked into a column of grey noise that a
 * reader has to decode rather than recognise, and they competed with the
 * labels they were meant to support.
 *
 * These are hand-drawn 16px paths rather than an icon package: the pages ship
 * as a static export behind a strict CSP, and pulling a library in to draw
 * twenty glyphs would cost more bytes than the whole nav. They inherit
 * `currentColor`, so the active/hover states in nav-tree.tsx keep working
 * without any per-icon colour logic.
 *
 * A missing key renders a small dot rather than nothing, so a new nav entry
 * never leaves a ragged hole in the column while its icon is being drawn.
 */
const PATHS: Record<string, string> = {
  // Daily
  home: "M2.5 6.8 8 2.5l5.5 4.3V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z",
  markets: "M2 12.5 6 8l2.5 2.5L14 4M14 4h-3.5M14 4v3.5",
  news: "M2.5 3.5h8v9h-8zM10.5 6.5h3v5a1 1 0 0 1-1 1M4.5 6h4M4.5 8.5h4M4.5 11h2.5",
  watchlist: "M8 2.6l1.7 3.4 3.8.55-2.75 2.68.65 3.77L8 11.22l-3.4 1.78.65-3.77L2.5 6.55l3.8-.55z",

  // Positions
  // A bound journal: spine down the middle, entries either side.
  ledger: "M8 4.2C6.8 3.2 5 2.9 3 3.1v8.6c2-.2 3.8.1 5 1.1 1.2-1 3-1.3 5-1.1V3.1c-2-.2-3.8.1-5 1.1zM8 4.2v8.6",
  portfolio: "M8 8V2.6a5.4 5.4 0 1 1-5.4 5.4z M8.9 2.6A5.4 5.4 0 0 1 13.4 7.1H8.9z",
  trading: "M2.5 10.5h11M2.5 10.5l3-3M13.5 5.5h-11M13.5 5.5l-3-3",
  alerts: "M8 2.5a3.5 3.5 0 0 0-3.5 3.5c0 3-1.2 4-1.2 4h9.4s-1.2-1-1.2-4A3.5 3.5 0 0 0 8 2.5zM6.75 12.5a1.3 1.3 0 0 0 2.5 0",

  // Research
  companies: "M3 13.5V4l5-1.5V13.5M8 13.5V6l5 1.5v6M5 6h1M5 8.5h1M10.5 9h1M10.5 11h1M2 13.5h12",
  financials: "M2.5 13.5h11M4.5 11V6.5M7.5 11V3.5M10.5 11V8M13 11V5",
  scores: "M8 2.5 9.8 6.2l4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.8l4-.6z",
  industries: "M2.5 13.5V7l3.5 2V7l3.5 2V4l4 2v7.5zM2 13.5h12",
  // Interlocking links, read left-to-right like the chain itself.
  valueChain: "M3.2 6.2h2.4a1.8 1.8 0 0 1 0 3.6H3.2a1.8 1.8 0 0 1 0-3.6zM10.4 6.2h2.4a1.8 1.8 0 0 1 0 3.6h-2.4a1.8 1.8 0 0 1 0-3.6zM6.4 8h3.2",
  knowledge: "M8 3.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM3.6 10a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM12.4 10a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM7 5.6 4.4 9.6M9 5.6l2.6 4M5 11.4h6",

  // Output
  notes: "M4 2.5h6l2.5 2.5v8.5h-8.5zM10 2.5V5h2.5M5.5 8h5M5.5 10.5h3",
  // A document whose content is a chart — what a report actually is.
  reports: "M4 2.5h5l3 3v8h-8zM9 2.5V5.5h3M6 11.5V9M8 11.5V7.5M10 11.5v-1.5",
  agent: "M4.5 5.5h7v6h-7zM8 5.5V3.5M6.5 3.5h3M6.75 8h.5M8.75 8h.5M6.5 10h3M3 7.5v2M13 7.5v2",

  // Enterprise
  ceo: "M8 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3.5 13.2a4.5 4.5 0 0 1 9 0",
  erp: "M2.5 5.5h11v8h-11zM6 5.5V3.5h4v2M2.5 9h11M8 9v4.5",
  board: "M5 4.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM11 4.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM1.8 12.4a3.4 3.4 0 0 1 6.4 0M7.8 12.4a3.4 3.4 0 0 1 6.4 0",

  // System
  agentOps: "M8 5.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM8 2.2v1.8M8 12v1.8M13.8 8H12M4 8H2.2M12.1 3.9l-1.3 1.3M5.2 10.8l-1.3 1.3M12.1 12.1l-1.3-1.3M5.2 5.2 3.9 3.9",
  admin: "M8 2.4 3.2 4.3v3.5c0 3 2 5 4.8 5.8 2.8-.8 4.8-2.8 4.8-5.8V4.3z",
  settings: "M2.5 4.5h11M2.5 8h11M2.5 11.5h11M6 3.2v2.6M10.5 6.7v2.6M5 10.2v2.6",
};

export function NavIcon({ name, className }: { name?: string; className?: string }) {
  const d = name ? PATHS[name] : undefined;
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d ? <path d={d} /> : <circle cx="8" cy="8" r="1.6" />}
    </svg>
  );
}
