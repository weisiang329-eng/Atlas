export interface SeriesPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: SeriesPoint[];
  height?: number;
  ariaLabel: string;
  /** Aurora Glass: soft glow on the primary line. Default on; off for print-dense contexts. */
  glow?: boolean;
  /** Unique gradient id when several charts share a page. */
  gradientId?: string;
}

/**
 * Lightweight area + line trend chart. Pure SVG (no dependencies, no runtime
 * JS) so it renders on the server and costs nothing on the client.
 *
 * VISUAL REFRESH v0.2 (Aurora Glass): the flat area fill is now a vertical
 * gradient (accent → transparent) and the primary line carries a soft accent
 * glow (`glow` prop, default on). API is backward-compatible.
 */
export function TrendChart({
  data,
  height = 180,
  ariaLabel,
  glow = true,
  gradientId = "trend-fill",
}: TrendChartProps) {
  if (data.length === 0) return null;

  const W = 640;
  const H = height;
  const pad = { t: 12, r: 14, b: 24, l: 14 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const pts = data.map((d, i) => ({
    x: pad.l + i * step,
    y: pad.t + innerH * (1 - (d.value - min) / range),
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const baseY = pad.t + innerH;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const area = `${line} L${last.x.toFixed(1)} ${baseY} L${first.x.toFixed(1)} ${baseY} Z`;

  const gridYs = [0, 0.5, 1].map((f) => pad.t + innerH * f);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={W - pad.r}
          y1={y}
          y2={y}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={
          glow
            ? { filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 55%, transparent))" }
            : undefined
        }
      />
      <circle cx={last.x} cy={last.y} r={3.5} fill="var(--accent)" />
      {data.map((d, i) => (
        <text
          key={d.label}
          x={pts[i]!.x}
          y={H - 6}
          textAnchor="middle"
          fill="var(--faint)"
          fontSize={11}
          fontFamily="var(--font-mono)"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}
