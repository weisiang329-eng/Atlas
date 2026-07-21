import type { Metadata } from "next";
import { ResultsSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Quarterly Results" };

export default function Page() {
  return <ResultsSection periodType="quarter" />;
}
