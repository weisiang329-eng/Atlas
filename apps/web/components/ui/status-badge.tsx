import { Badge } from "@/components/ui/badge";

type Tone = "neutral" | "accent" | "positive" | "negative" | "warning" | "info";

const STATUS_TONE: Record<string, Tone> = {
  Draft: "neutral",
  "In review": "warning",
  Final: "positive",
  Active: "positive",
  Pending: "warning",
  Blocked: "negative",
  Archived: "neutral",
  Open: "info",
  Confirmed: "positive",
  Rejected: "negative",
};

/**
 * Semantic status pill. Centralises the status → tone mapping so every workspace
 * shows the same status the same way. Unknown statuses fall back to neutral.
 */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}

export type ConfidenceLevel = "Low" | "Medium" | "High";

const CONFIDENCE_TONE: Record<ConfidenceLevel, Tone> = {
  Low: "negative",
  Medium: "warning",
  High: "positive",
};

/** Confidence pill with a consistent Low/Medium/High colour scale. */
export function ConfidenceBadge({
  level,
  showWord = false,
}: {
  level: ConfidenceLevel;
  /** Append the word "confidence" (for standalone use outside a labelled field). */
  showWord?: boolean;
}) {
  return (
    <Badge tone={CONFIDENCE_TONE[level]}>
      <span aria-label={`${level} confidence`}>
        {level}
        {showWord ? " confidence" : ""}
      </span>
    </Badge>
  );
}
