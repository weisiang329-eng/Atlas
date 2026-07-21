"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { ChartContainer } from "@/components/chart/chart-container";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { RiskMatrix } from "@/components/board/risk-matrix";
import { formatDate } from "@/lib/format";
import { RISK_REGISTER, BOARD_MEETINGS, type RiskItem } from "@/lib/mock/board";

const STATUS_TONE = { open: "negative", mitigating: "warning", closed: "positive" } as const;
const STATUS_LABEL = { open: "未处理", mitigating: "缓解中", closed: "已关闭" } as const;
const PACK_TONE = { draft: "neutral", review: "info", final: "positive" } as const;
const PACK_LABEL = { draft: "草稿", review: "复核中", final: "定稿" } as const;

const riskCols: Column<RiskItem>[] = [
  { key: "title", header: "风险", sortable: true },
  { key: "owner", header: "负责人", className: "text-muted" },
  { key: "likelihood", header: "可能性", numeric: true, sortable: true, sortAccessor: (r) => r.likelihood },
  { key: "impact", header: "影响", numeric: true, sortable: true, sortAccessor: (r) => r.impact },
  {
    key: "score",
    header: "评分",
    numeric: true,
    sortable: true,
    sortAccessor: (r) => r.likelihood * r.impact,
    render: (r) => <span className="num font-medium">{r.likelihood * r.impact}</span>,
  },
  { key: "status", header: "状态", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
];

export default function BoardPage() {
  return (
    <>
      <SectionHeading title="董事会情报" description="风险矩阵 + 登记册 + 会议与董事会包状态。" />

      <div className="mb-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <ChartContainer title="风险矩阵" subtitle="可能性 × 影响">
          <RiskMatrix risks={RISK_REGISTER} />
        </ChartContainer>
        <ChartContainer title="会议与董事会包" subtitle="一键生成，人审后定稿">
          <ul className="flex flex-col divide-y divide-border">
            {BOARD_MEETINGS.map((m) => (
              <li key={m.id} className="flex items-start gap-3 py-3">
                <span className="num w-24 shrink-0 text-sm text-fg">{formatDate(m.date)}</span>
                <span className="flex-1 text-sm text-muted">{m.agenda.join(" · ")}</span>
                <Badge tone={PACK_TONE[m.packStatus]}>{PACK_LABEL[m.packStatus]}</Badge>
              </li>
            ))}
          </ul>
        </ChartContainer>
      </div>

      <ChartContainer title="风险登记册" subtitle="按评分排序，评分 = 可能性 × 影响">
        <DataTable
          columns={riskCols}
          rows={[...RISK_REGISTER].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)}
          getRowId={(r) => r.id}
          caption="Risk register"
        />
      </ChartContainer>
    </>
  );
}
