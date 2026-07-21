import type { Metadata } from "next";
import { StatementSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Balance Sheet" };

export default function Page() {
  return <StatementSection type="balance-sheet" />;
}
