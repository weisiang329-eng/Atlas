import { DonutChart } from "@/components/chart/donut";
import { formatCompact } from "@/lib/format";
import { MOCK_HOLDINGS, ASSET_CLASS_COLOR } from "@/lib/mock/portfolio";
import { computeHoldingRows } from "@/components/portfolio/holdings-table";

export function ExposurePanel() {
  const rows = computeHoldingRows(MOCK_HOLDINGS);
  const byClass = new Map<string, number>();
  for (const r of rows) byClass.set(r.assetClass, (byClass.get(r.assetClass) ?? 0) + r.marketValue);
  const total = rows.reduce((a, r) => a + r.marketValue, 0);
  const segments = Array.from(byClass.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, color: ASSET_CLASS_COLOR[label as keyof typeof ASSET_CLASS_COLOR] }));

  return (
    <div className="flex items-center gap-6">
      <DonutChart
        segments={segments}
        size={150}
        thickness={20}
        ariaLabel="Asset class exposure"
        centerLabel="类别"
        centerValue={String(segments.length)}
      />
      <div className="flex flex-1 flex-col gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: s.color }} />
            <span className="flex-1 text-fg">{s.label}</span>
            <span className="num text-muted">{formatCompact(s.value)}</span>
            <span className="num w-12 text-right text-faint">{((s.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
