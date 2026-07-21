export interface IntradayPoint {
  /** Time label, e.g. "09:30". Shown sparsely. */
  label: string;
  value: number;
}

interface IntradayChartProps {
  data: IntradayPoint[];
  /** Previous close — the baseline the session trades against. */
  prevClose: number;
  height?: number;
  ariaLabel: string;
  labelCount?: number;
}

/**
 * 分时 (time-of-day) chart — NEW in Visual Refresh v0.2 for P027 Markets.
 * Line + area vs the previous-close baseline: above the baseline fills
 * positive, below fills negative; the baseline is a faint dashed rule.
 * Pure SVG, token colours only.
 */
export function IntradayChart({
  data,
  prevClose,
  height = 200,
  ariaLabel,
  labelCount = 4,
}: IntradayChartProps) {
  if (data.length === 0) return null;

  const W = 640;
  const H = height;
  const pad = { t: 10, r: 10, b: 20, l: 10 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = data.map((d) => d.value).concat(prevClose);
  let max = Math.max(...values);
  let min = Math.min(...values);
  const span = max - min || 1;
  max += span * 0.08;
  min -= span * 0.08;
  const range = max - min;

  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const X = (i: number) => pad.l + i * step;
  const Y = (v: number) => pad.t + innerH * (1 - (v - min) / range);
  const baseY = Y(prevClose);

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)} ${Y(d.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${X(data.length - 1).toFixed(1)} ${baseY.toFixed(1)} L${X(0).toFixed(1)} ${baseY.toFixed(1)} Z`;

  const last = data[data.length - 1]!;
  const up = last.value >= prevClose;
  const lineColor = up ? "var(--positive)" : "var(--negative)";
  const clipId = `intraday-clip-${Math.round(prevClose * 100)}`;
  const labelEvery = Math.max(1, Math.floor(data.length / labelCount));

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
        {/* Above/below the previous close use separate clips so each side tints semantically. */}
        <clipPath id={`${clipId}-above`}>
          <rect x={0} y={0} width={W} height={baseY} />
        </clipPath>
        <clipPath id={`${clipId}-below`}>
          <rect x={0} y={baseY} width={W} height={H - baseY} />
        </clipPath>
      </defs>
      <path d={area} fill="var(--positive)" fillOpacity={0.14} clipPath={`url(#${clipId}-above)`} />
      <path d={area} fill="var(--negative)" fillOpacity={0.14} clipPath={`url(#${clipId}-below)`} />
      <line
        x1={pad.l}
        x2={W - pad.r}
        y1={baseY}
        y2={baseY}
        stroke="var(--faint)"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.7}
      />
      <path
        d={line}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 5px color-mix(in srgb, ${up ? "var(--positive)" : "var(--negative)"} 50%, transparent))`,
        }}
      />
      <circle cx={X(data.length - 1)} cy={Y(last.value)} r={3} fill={lineColor} />
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text
            key={i}
            x={X(i)}
            y={H - 6}
            textAnchor="middle"
            fill="var(--faint)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
