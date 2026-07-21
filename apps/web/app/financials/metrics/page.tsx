import type { Metadata } from "next";
import { MetricsSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Financial Metrics" };

export default function Page() {
  return <MetricsSection />;
}
