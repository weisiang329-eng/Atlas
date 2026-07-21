import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { LedgerWorkspace } from "@/components/ledger/ledger-workspace";

export const metadata: Metadata = { title: "Trade Ledger" };

/**
 * Trade ledger — the owner's own book of record.
 * Model and accounting rules: docs/PORTFOLIO-ACCOUNTING.md
 */
export default function LedgerPage() {
  return (
    <AppShell title="Ledger">
      <PageHeader
        eyebrowKey="page.ledger.eyebrow"
        titleKey="page.ledger.title"
        descriptionKey="page.ledger.desc"
      />
      <LedgerWorkspace />
    </AppShell>
  );
}
