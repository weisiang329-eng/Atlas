export interface SeriesPoint {
  label: string;
  value: number;
}

interface BarSeriesProps {
  data: SeriesPoint[];
  height?: number;
  ariaLabel: string;
  /**
   * VISUAL REFRESH v0.2 — "accent" (default, unchanged): positive bars in the
   * brand accent (single-series magnitude charts, e.g. revenue). "semantic":
   * positive = --positive, for +/- return series (e.g. monthly returns) where
   * green/red carries meaning.
   */
  tone?: "accent" | "semantic";
}

/**
 * Simple vertical bar chart. Pure SVG, server-rendered. Negative values render
 * below the zero baseline in the "negative" semantic colour.
 */
export function BarSeries({
  data,
  height = 180,
  ariaLabel,
  tone = "accent",
}: BarSeriesProps) {
  if (data.length === 0) return null;

  const W = 640;
  const H = height;
  const pad = { t: 12, r: 8, b: 24, l: 8 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const zeroY = pad.t + innerH * (max / range);

  const slot = innerW / data.length;
  const barW = Math.min(48, slot * 0.6);
  const posFill = tone === "semantic" ? "var(--positive)" : "var(--accent)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <line
        x1={pad.l}
        x2={W - pad.r}
        y1={zeroY}
        y2={zeroY}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const cx = pad.l + slot * i + slot / 2;
        const h = (Math.abs(d.value) / range) * innerH;
        const y = d.value >= 0 ? zeroY - h : zeroY;
        const positive = d.value >= 0;
        return (
          <g key={d.label}>
            <rect
              x={cx - barW / 2}
              y={y}
              width={barW}
              height={Math.max(1, h)}
              rx={2.5}
              fill={positive ? posFill : "var(--negative)"}
              fillOpacity={0.85}
            />
            <text
              x={cx}
              y={H - 6}
              textAnchor="middle"
              fill="var(--faint)"
              fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
