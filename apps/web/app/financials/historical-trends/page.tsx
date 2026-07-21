import type { Metadata } from "next";
import { TrendsSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Historical Trends" };

export default function Page() {
  return <TrendsSection />;
}
