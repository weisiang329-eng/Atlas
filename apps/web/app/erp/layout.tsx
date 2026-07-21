import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import type { SubTab } from "@/lib/nav";

const TABS: SubTab[] = [
  { label: "晨光家具 Furniture", href: "/erp/furniture" },
  { label: "制造 Manufacturing", href: "/erp/manufacturing" },
  { label: "采购 Procurement", href: "/erp/procurement" },
  { label: "仓储 Warehouse", href: "/erp/warehouse" },
];

export default function ErpLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLayout
      title="ERP Intelligence"
      eyebrow="P014 · ERP Intelligence"
      description="把「看股票」的方法用来看自己的生意：收入结构、客户集中度、SKU 毛利。接入自研 Hono+D1 ERP。"
      tabs={TABS}
    >
      {children}
    </WorkspaceLayout>
  );
}
