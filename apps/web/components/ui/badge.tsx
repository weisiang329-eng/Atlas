import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "accent" | "positive" | "negative";

const TONE: Record<BadgeTone, string> = {
  neutral: "border-border text-muted",
  accent: "border-accent-dim text-accent",
  positive: "border-positive/40 text-positive",
  negative: "border-negative/40 text-negative",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

/** Compact monospace label used for statuses and tags across the terminal. */
export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-2xs uppercase tracking-[0.08em]",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
