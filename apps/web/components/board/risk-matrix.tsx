import type { RiskItem } from "@/lib/mock/board";

/**
 * Risk matrix — 5×5 likelihood × impact grid, pure token colours. A cell shows
 * the count of risks landing on it; hover reveals titles. v1 of the P019
 * RiskMatrix (components/viz/risk-matrix.tsx is the richer shared version).
 */
export function RiskMatrix({ risks }: { risks: RiskItem[] }) {
  const cell = (l: number, i: number) => risks.filter((r) => r.likelihood === l && r.impact === i);
  // score = likelihood*impact; colour band by severity.
  const band = (score: number) =>
    score >= 15 ? "bg-negative/70 text-bg" : score >= 8 ? "bg-warning/60 text-bg" : score >= 4 ? "bg-warning/25 text-fg" : "bg-positive/25 text-fg";

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-around pr-1 text-2xs text-faint" aria-hidden>
        <span className="[writing-mode:vertical-rl]">影响 Impact →</span>
      </div>
      <div>
        <div className="grid grid-cols-5 gap-1">
          {[5, 4, 3, 2, 1].map((impact) =>
            [1, 2, 3, 4, 5].map((likelihood) => {
              const items = cell(likelihood, impact);
              const score = likelihood * impact;
              return (
                <div
                  key={`${likelihood}-${impact}`}
                  title={items.map((r) => r.title).join("\n") || `L${likelihood} × I${impact}`}
                  className={`flex h-12 w-12 items-center justify-center rounded text-sm font-semibold ${band(score)} ${items.length === 0 ? "opacity-40" : ""}`}
                >
                  {items.length || ""}
                </div>
              );
            }),
          )}
        </div>
        <div className="mt-1 text-center text-2xs text-faint">可能性 Likelihood →</div>
      </div>
    </div>
  );
}
