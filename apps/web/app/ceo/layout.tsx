import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function CeoLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="CEO Dashboard"
      eyebrow="P018 · CEO Dashboard"
      description="跨公司 KPI 汇总、现金流与异常——开会就看这页。数据聚合自各企业 ERP（P014–P017）。"
    >
      {children}
    </WorkspaceLayout>
  );
}
