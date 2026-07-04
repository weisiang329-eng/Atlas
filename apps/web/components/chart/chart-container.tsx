import type { ReactNode } from "react";
import { DataState, type ResourceStatus } from "@/components/ui/data-state";
import { ChartSkeleton } from "@/components/ui/loading-state";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Async status — defaults to ready. Swaps to skeleton/empty/error cleanly. */
  status?: ResourceStatus;
  height?: number;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Framed shell around any chart. Owns the title, optional legend/actions slot,
 * loading/empty/error states and a consistent plot height. Chart primitives
 * drop in as children, so every chart in Atlas shares one container contract.
 */
export function ChartContainer({
  title,
  subtitle,
  actions,
  status = "ready",
  height = 180,
  footer,
  children,
}: ChartContainerProps) {
  return (
    <section className="flex flex-col rounded-panel border border-border bg-surface shadow-panel">
      <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-sm font-semibold text-fg">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-2xs text-muted">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className="p-4">
        <DataState status={status} loading={<ChartSkeleton height={height} />}>
          {children}
        </DataState>
      </div>
      {footer ? (
        <footer className="border-t border-border px-4 py-2 text-2xs text-faint">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
