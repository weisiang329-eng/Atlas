import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StyleGuide } from "@/components/style-guide/style-guide";

export const metadata: Metadata = { title: "Style Guide" };

export default function StyleGuidePage() {
  return (
    <AppShell title="Style Guide">
      <PageHeader
        eyebrow="Design system"
        title="Style guide"
        description="A living gallery of Atlas design tokens and reusable components. The self-documenting surface of the UI operating system."
        actions={<Badge tone="accent">Living</Badge>}
      />
      <StyleGuide />
    </AppShell>
  );
}
