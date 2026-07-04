import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Dashboard framework. A 12-column grid on large screens (2-up on tablet,
 * stacked on mobile) that any workspace composes widgets into. Keeps every
 * dashboard on one spatial system instead of bespoke per-page grids.
 */
export function DashboardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

const SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  6: "lg:col-span-6",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  12: "lg:col-span-12",
};

/** A dashboard cell. `span` is the large-screen column span (of 12). */
export function Widget({
  span = 6,
  children,
  className,
}: {
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(SPAN[span], className)}>{children}</div>;
}
