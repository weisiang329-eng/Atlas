import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { HomeCockpit } from "@/components/home/home-cockpit";

export const metadata: Metadata = { title: "Home" };

/**
 * Home — the investment cockpit.
 *
 * The Sprint-000 marketing card grid ("four workspaces you could visit") is
 * gone: the sidebar already navigates, so those cards spent the most valuable
 * screen space on links. The cockpit answers what changed instead.
 */
export default function HomePage() {
  return (
    <AppShell title="Home">
      <PageHeader
        eyebrowKey="page.home.eyebrow"
        titleKey="page.home.title"
        descriptionKey="page.home.desc"
      />
      <HomeCockpit />
    </AppShell>
  );
}
