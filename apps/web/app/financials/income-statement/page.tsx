import type { Metadata } from "next";
import { StatementSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Income Statement" };

export default function Page() {
  return <StatementSection type="income-statement" />;
}
