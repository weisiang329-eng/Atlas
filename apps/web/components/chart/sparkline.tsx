interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
  /**
   * VISUAL REFRESH v0.2: sparkline colour follows series direction by default
   * (up = positive, down = negative, flat = accent), per the chart grammar in
   * docs/design/00-visual-refresh.md. Pass "accent" to keep the old behaviour.
   */
  tone?: "auto" | "accent" | "positive" | "negative";
}

/**
 * Inline micro-trend for table cells and metric tiles. Pure SVG, no labels.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  ariaLabel,
  tone = "auto",
}: SparklineProps) {
  if (values.length < 2) return null;

  const pad = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = (width - pad * 2) / (values.length - 1);

  const pts = values.map((v, i) => ({
    x: pad + i * step,
    y: pad + (height - pad * 2) * (1 - (v - min) / range),
  }));
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1]!;

  const first = values[0]!;
  const end = values[values.length - 1]!;
  const stroke =
    tone === "accent"
      ? "var(--accent)"
      : tone === "positive"
        ? "var(--positive)"
        : tone === "negative"
          ? "var(--negative)"
          : end > first
            ? "var(--positive)"
            : end < first
              ? "var(--negative)"
              : "var(--accent)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? "Trend"}
      className="inline-block align-middle"
    >
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r={1.8} fill={stroke} />
    </svg>
  );
}
