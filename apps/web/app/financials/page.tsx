import type { Metadata } from "next";
import { OverviewSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Financials" };

export default function Page() {
  return <OverviewSection />;
}
