import type { Metadata } from "next";
import { StatementSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Cash Flow" };

export default function Page() {
  return <StatementSection type="cash-flow" />;
}
