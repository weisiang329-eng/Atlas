/**
 * MOCK company timeline events. Labels only — illustrative, not sourced.
 */
import type { TimelineEvent } from "@/components/ui/timeline";

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: "t1",
    date: "2025-02-19",
    title: "Q4 FY24 results reported",
    category: "Filing",
    description: "Quarterly results and updated guidance published.",
  },
  {
    id: "t2",
    date: "2024-11-12",
    title: "New data-center product line announced",
    category: "Event",
    description: "Expanded roadmap into liquid-cooled compute.",
  },
  {
    id: "t3",
    date: "2024-08-01",
    title: "Rating raised to Overweight",
    category: "Research",
    description: "Thesis updated on improving margin trajectory.",
  },
  {
    id: "t4",
    date: "2024-05-20",
    title: "Added to coverage",
    category: "Decision",
    description: "Company entered the Atlas coverage universe.",
  },
];
