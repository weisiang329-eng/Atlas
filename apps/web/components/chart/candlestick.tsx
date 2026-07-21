export interface Candle {
  /** Period label, e.g. "07-18" or "Q2". Shown sparsely on the x-axis. */
  label: string;
  o: number;
  h: number;
  l: number;
  c: number;
  /** Optional volume; when present a histogram renders under the plot. */
  v?: number;
}

interface CandlestickProps {
  data: Candle[];
  height?: number;
  ariaLabel: string;
  /** Show the volume histogram strip (needs `v` on candles). Default true. */
  volume?: boolean;
  /** How many x labels to show (evenly sampled). Default 5. */
  labelCount?: number;
}

/**
 * OHLC candlestick chart — NEW in Visual Refresh v0.2, first consumer is the
 * P027 Markets workspace. Pure SVG, server-renderable, token colours only:
 * up = positive, down = negative (never the accent). Body = open→close,
 * wick = high→low, min body height 1px.
 */
export function Candlestick({
  data,
  height = 240,
  ariaLabel,
  volume = true,
  labelCount = 5,
}: CandlestickProps) {
  if (data.length === 0) return null;

  const W = 640;
  const H = height;
  const hasVol = volume && data.some((d) => d.v !== undefined);
  const volH = hasVol ? Math.round(H * 0.18) : 0;
  const pad = { t: 10, r: 10, b: 20, l: 10 };
  const plotH = H - pad.t - pad.b - volH - (hasVol ? 6 : 0);
  const innerW = W - pad.l - pad.r;

  const hi = Math.max(...data.map((d) => d.h));
  const lo = Math.min(...data.map((d) => d.l));
  const range = hi - lo || 1;
  const maxV = hasVol ? Math.max(...data.map((d) => d.v ?? 0)) || 1 : 1;

  const step = innerW / data.length;
  const bodyW = Math.max(2, Math.min(14, step * 0.6));
  const Y = (v: number) => pad.t + ((hi - v) / range) * plotH;
  const volTop = pad.t + plotH + 6;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => pad.t + plotH * f);
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
      {gridYs.map((y, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={W - pad.r}
          y1={y}
          y2={y}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.45}
        />
      ))}
      {data.map((d, i) => {
        const x = pad.l + i * step + step / 2;
        const up = d.c >= d.o;
        const col = up ? "var(--positive)" : "var(--negative)";
        const bodyY = Y(Math.max(d.o, d.c));
        const bodyH = Math.max(1, Math.abs(Y(d.o) - Y(d.c)));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={Y(d.h)} y2={Y(d.l)} stroke={col} strokeWidth={1} />
            <rect
              x={x - bodyW / 2}
              y={bodyY}
              width={bodyW}
              height={bodyH}
              rx={0.5}
              fill={col}
            />
            {hasVol && d.v !== undefined ? (
              <rect
                x={x - bodyW / 2}
                y={volTop + volH * (1 - d.v / maxV)}
                width={bodyW}
                height={Math.max(1, volH * (d.v / maxV))}
                rx={0.5}
                fill={col}
                fillOpacity={0.35}
              />
            ) : null}
            {i % labelEvery === 0 ? (
              <text
                x={x}
                y={H - 6}
                textAnchor="middle"
                fill="var(--faint)"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {d.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
