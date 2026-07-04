import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const LEFT_WIDTH: Record<string, string> = {
  sm: "lg:grid-cols-[minmax(0,16rem)_1fr]",
  md: "lg:grid-cols-[minmax(0,20rem)_1fr]",
  lg: "lg:grid-cols-[minmax(0,24rem)_1fr]",
  half: "lg:grid-cols-2",
};

/**
 * Two-pane layout. Side-by-side from `lg`, stacked below. `leftWidth` sets the
 * fixed-ish width of the left pane. The generic base for document viewers,
 * master–detail and comparison workflows — one responsive split, everywhere.
 */
export function SplitPaneLayout({
  left,
  right,
  leftWidth = "md",
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: "sm" | "md" | "lg" | "half";
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", LEFT_WIDTH[leftWidth], className)}>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}
