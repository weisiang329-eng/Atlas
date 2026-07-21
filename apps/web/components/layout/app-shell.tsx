import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

/**
 * Two-column terminal shell: fixed nav rail + scrollable workspace on desktop.
 * Below `lg` the rail is replaced by the bottom tab bar, so `main` reserves
 * room for it (`pb-24`) to keep the last row clear of the bar.
 */
export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="atlas-grid flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
