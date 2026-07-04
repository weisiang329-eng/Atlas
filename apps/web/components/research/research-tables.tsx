"use client";

import { DataTable, type Column } from "@/components/data/data-table";
import { StatusBadge, ConfidenceBadge } from "@/components/ui/status-badge";
import type {
  NoteRow,
  ReportRow,
  EvidenceRow,
  VersionRow,
  HypothesisRow,
  DecisionRow,
} from "@/lib/mock/research";

/**
 * Client tables for the Research workspace. Column definitions (with badge
 * renderers) live here so the section pages stay server components that just
 * pass mock rows. All data is sample.
 */

export function NotesTable({ rows }: { rows: NoteRow[] }) {
  const columns: Column<NoteRow>[] = [
    { key: "title", header: "Title" },
    { key: "company", header: "Company" },
    { key: "theme", header: "Theme" },
    { key: "author", header: "Author" },
    { key: "updated", header: "Updated" },
  ];
  return <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Research notes" />;
}

export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  const columns: Column<ReportRow>[] = [
    { key: "title", header: "Report" },
    { key: "company", header: "Company" },
    { key: "version", header: "Version" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date" },
  ];
  return <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Research reports" />;
}

export function EvidenceTableView({ rows }: { rows: EvidenceRow[] }) {
  const columns: Column<EvidenceRow>[] = [
    { key: "claim", header: "Claim" },
    { key: "source", header: "Source" },
    { key: "type", header: "Type" },
    { key: "confidence", header: "Confidence", render: (r) => <ConfidenceBadge level={r.confidence} /> },
    { key: "date", header: "Date" },
  ];
  return <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Evidence log" />;
}

export function VersionsTable({ rows }: { rows: VersionRow[] }) {
  const columns: Column<VersionRow>[] = [
    { key: "version", header: "Version" },
    { key: "report", header: "Report" },
    { key: "author", header: "Author" },
    { key: "change", header: "Change" },
    { key: "date", header: "Date" },
  ];
  return <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Version history" />;
}

export function HypothesesTable({ rows }: { rows: HypothesisRow[] }) {
  const columns: Column<HypothesisRow>[] = [
    { key: "hypothesis", header: "Hypothesis" },
    { key: "company", header: "Company" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "confidence", header: "Confidence", render: (r) => <ConfidenceBadge level={r.confidence} /> },
    { key: "updated", header: "Updated" },
  ];
  return <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Hypotheses" />;
}

export function DecisionsTable({ rows }: { rows: DecisionRow[] }) {
  const columns: Column<DecisionRow>[] = [
    { key: "decision", header: "Decision" },
    { key: "context", header: "Context" },
    { key: "conviction", header: "Conviction" },
    { key: "outcome", header: "Outcome" },
    { key: "date", header: "Date" },
  ];
  return <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Decision journal" />;
}
