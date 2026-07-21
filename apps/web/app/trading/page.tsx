"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { ChartContainer } from "@/components/chart/chart-container";
import { OrderTicket } from "@/components/trading/order-ticket";
import { OrdersTable } from "@/components/trading/orders-table";

export default function TradingPage() {
  return (
    <>
      <SectionHeading
        title="下单 · 掛单 · 成交"
        description="系统只执行手动确认的指令，不做自动交易信号执行。真仓（real）在风控复核前不开放，见 docs/design/P028。"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <ChartContainer title="Order Ticket" subtitle="确认后才送出">
          <OrderTicket />
        </ChartContainer>
        <ChartContainer title="订单记录" subtitle="Paper 模式">
          <OrdersTable />
        </ChartContainer>
      </div>
    </>
  );
}
