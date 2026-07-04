import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TabNav } from "@/components/layout/tab-nav";
import { PageHeader } from "@/components/ui/page-header";
import type { SubTab } from "@/lib/nav";

interface WorkspaceLayoutProps {
  /** AppShell title (top bar). */
  title: string;
  /** Sub-navigation tabs for this workspace. */
  tabs?: SubTab[];
  children: ReactNode;

  // Default header (PageHeader). Ignored when `header` is provided.
  eyebrow?: string;
  heading?: string;
  description?: string;
  actions?: ReactNode;

  /** Custom header slot — replaces the default PageHeader (e.g. an entity masthead). */
  header?: ReactNode;
}

/**
 * One layout for every workspace: shell + header + tab navigation + content.
 * Financials, Research and Knowledge use the default `PageHeader`; the company
 * detail passes a custom `header`. Extracted so a new workspace is a few props,
 * not a copied layout — the spine every future module hangs off.
 */
export function WorkspaceLayout({
  title,
  tabs,
  children,
  eyebrow,
  heading,
  description,
  actions,
  header,
}: WorkspaceLayoutProps) {
  return (
    <AppShell title={title}>
      {header ?? (
        <PageHeader
          eyebrow={eyebrow}
          title={heading ?? title}
          description={description}
          actions={actions}
        />
      )}
      {tabs ? <TabNav items={tabs} /> : null}
      <div className="pt-6">{children}</div>
    </AppShell>
  );
}
