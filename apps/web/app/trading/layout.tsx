import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { Badge } from "@/components/ui/badge";

export default function TradingLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Trading"
      eyebrow="P028 · Trading"
      description="美股手动确认下单，Paper 模式默认。大马标的仅出信号，不提供下单（Bursa 无散户 API）。"
      actions={<Badge tone="info">PAPER</Badge>}
    >
      {children}
    </WorkspaceLayout>
  );
}
