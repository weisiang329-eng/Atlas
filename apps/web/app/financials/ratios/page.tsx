import type { Metadata } from "next";
import { RatiosSection } from "@/components/financial/live-sections";

export const metadata: Metadata = { title: "Ratios" };

export default function Page() {
  return <RatiosSection />;
}
