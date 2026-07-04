/**
 * MOCK home-dashboard data: KPIs and an activity feed. Illustrative sample only.
 */
import type { ActivityItem } from "@/components/ui/activity-feed";
import type { KpiDirection } from "@/components/ui/kpi-card";

export interface HomeKpi {
  label: string;
  value: string;
  delta?: string;
  direction?: KpiDirection;
  series?: number[];
  hint?: string;
}

export const HOME_KPIS: HomeKpi[] = [
  { label: "Coverage", value: "06", delta: "+2 QoQ", direction: "up", series: [3, 4, 5, 6], hint: "companies" },
  { label: "Research Notes", value: "05", delta: "+3 wk", direction: "up", series: [1, 2, 3, 5], hint: "this week" },
  { label: "Open Alerts", value: "03", delta: "flat", direction: "flat", series: [3, 4, 3, 3], hint: "watching" },
  { label: "Reports", value: "04", delta: "+1 wk", direction: "up", series: [2, 3, 3, 4], hint: "in review" },
];

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", kind: "research", title: "Helios conviction memo drafted", meta: "Decision memo · A. Analyst", time: "2h" },
  { id: "a2", kind: "filing", title: "Helios FY24 report filed", meta: "Company filing", time: "1d" },
  { id: "a3", kind: "alert", title: "Concentration monitor triggered", meta: "Helios Compute", time: "1d" },
  { id: "a4", kind: "decision", title: "Opened power & cooling coverage", meta: "Industry", time: "2d" },
  { id: "a5", kind: "research", title: "Evidence added: operating margin ~39%", meta: "Helios Compute", time: "2d" },
  { id: "a6", kind: "system", title: "Weekly intelligence brief published", meta: "Week 08", time: "3d" },
];
