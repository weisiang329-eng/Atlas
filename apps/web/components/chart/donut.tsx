export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  ariaLabel: string;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Donut/ring chart — NEW in this hand-off (P012 Portfolio exposure, reusable
 * anywhere a class/category split is shown). Pure SVG, token colours passed
 * in by the caller (never hardcoded here), small gap between segments.
 */
export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  ariaLabel,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const gap = 0.014;
  let acc = 0;

  const arcs = segments.map((s, i) => {
    const a0 = (acc / total) * 2 * Math.PI - Math.PI / 2 + gap;
    acc += s.value;
    const a1 = (acc / total) * 2 * Math.PI - Math.PI / 2 - gap;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return (
      <path
        key={i}
        d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
        fill="none"
        stroke={s.color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel}>
        {arcs}
      </svg>
      {centerLabel || centerValue ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel ? <span className="text-2xs text-faint">{centerLabel}</span> : null}
          {centerValue ? <span className="num font-serif text-xl font-medium text-fg">{centerValue}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
