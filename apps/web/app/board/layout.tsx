import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="Board"
      eyebrow="P019 · Board Intelligence"
      description="董事会包、风险矩阵与决策待办。包由 P013 报告引擎自动生成，风险与待办汇聚自 P008/P018。"
    >
      {children}
    </WorkspaceLayout>
  );
}
