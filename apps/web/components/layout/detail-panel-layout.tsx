import type { ReactNode } from "react";
import { SplitPaneLayout } from "@/components/layout/split-pane-layout";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Master–detail layout: a list (master) beside a detail panel. When nothing is
 * selected, the detail side shows an empty state. Built on SplitPaneLayout; the
 * parent owns selection. The spine for company/entity browsing, inbox-style
 * views and anything list-then-detail.
 */
export function DetailPanelLayout({
  list,
  detail,
  emptyTitle = "Nothing selected",
  emptyBody = "Choose an item from the list to see its detail.",
  leftWidth = "md",
}: {
  list: ReactNode;
  detail: ReactNode | null;
  emptyTitle?: string;
  emptyBody?: string;
  leftWidth?: "sm" | "md" | "lg";
}) {
  return (
    <SplitPaneLayout
      leftWidth={leftWidth}
      left={list}
      right={
        detail ?? (
          <div className="rounded-panel border border-border bg-surface">
            <EmptyState title={emptyTitle} body={emptyBody} />
          </div>
        )
      }
    />
  );
}
