export interface SeriesPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: SeriesPoint[];
  height?: number;
  ariaLabel: string;
}

/**
 * Lightweight area + line trend chart. Pure SVG (no dependencies, no runtime
 * JS) so it renders on the server and costs nothing on the client. Emphasized
 * endpoint and a faint baseline grid, per data-viz conventions.
 */
export function TrendChart({ data, height = 180, ariaLabel }: TrendChartProps) {
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
      <path d={area} fill="var(--accent)" fillOpacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
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
