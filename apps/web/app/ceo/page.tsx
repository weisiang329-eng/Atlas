"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { ChartContainer } from "@/components/chart/chart-container";
import { BarSeries } from "@/components/chart/bar-series";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatDate, formatPercent } from "@/lib/format";
import { CEO_COMPANIES, CASH_FLOW_6M } from "@/lib/mock/ceo";

export default function CeoPage() {
  const totalCash = CEO_COMPANIES.reduce((a, c) => a + c.cash, 0);
  const totalRevenue = CEO_COMPANIES.reduce((a, c) => a + c.revenue, 0);

  return (
    <>
      <SectionHeading title="经营总览" description="每家生意本月表现、合并现金与需要拍板的异常。" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {CEO_COMPANIES.map((c) => (
          <div key={c.id} className={`rounded-panel border bg-surface p-5 shadow-panel ${c.stale ? "border-warning/50" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-fg">{c.name}</h3>
                <span className="text-2xs text-faint">{c.kind}</span>
              </div>
              {c.stale ? <Badge tone="warning">数据陈旧</Badge> : <Badge tone="positive">最新</Badge>}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <KpiCard label="本月收入" value={formatCompact(c.revenue)} />
              <KpiCard label="毛利率" value={`${c.grossMarginPct.toFixed(1)}%`} />
              <KpiCard label="现金" value={formatCompact(c.cash)} delta={formatPercent(c.yoyPct, 1)} direction={c.yoyPct >= 0 ? "up" : "down"} />
            </div>
            <p className="mt-3 text-2xs text-faint">数据截至 {formatDate(c.asOf)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="合并净现金流" subtitle={`近 6 月 · 合计现金 ${formatCompact(totalCash)}`} height={180}>
          <BarSeries data={CASH_FLOW_6M} ariaLabel="Net cash flow" tone="semantic" height={180} />
        </ChartContainer>
        <ChartContainer title="异常与待办" subtitle="来自各企业 ERP 告警">
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-2 rounded border border-warning/40 bg-warning/10 p-2.5 text-sm">
              <Badge tone="warning">注意</Badge>
              <span className="text-fg">小灶餐饮数据已 20 天未同步 — 需检查 ERP 连接。</span>
            </li>
            <li className="flex items-start gap-2 rounded border border-border bg-surface-2/40 p-2.5 text-sm">
              <Badge tone="info">提示</Badge>
              <span className="text-fg">晨光家具本月收入同比 +12.4%，创年内新高。</span>
            </li>
          </ul>
        </ChartContainer>
      </div>

      <p className="mt-4 text-2xs text-faint">合并口径：本页合计未做币种换算（示例）；真实合并需接 P004 ExchangeRate。总收入 {formatCompact(totalRevenue)}。</p>
    </>
  );
}
