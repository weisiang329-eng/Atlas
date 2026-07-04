/**
 * MOCK document list for the DocumentViewer. Labels only — no real filings,
 * no stored files. Exists to shape the viewer UI.
 */
import type { DocItem } from "@/components/ui/document-viewer";

export const MOCK_DOCUMENTS: DocItem[] = [
  {
    id: "d1",
    title: "Annual report (FY24)",
    type: "Annual filing",
    date: "2025-02-18",
    source: "Company filing",
    pages: 142,
  },
  {
    id: "d2",
    title: "Q4 FY24 earnings call transcript",
    type: "Transcript",
    date: "2025-02-19",
    source: "Investor relations",
    pages: 24,
  },
  {
    id: "d3",
    title: "Investor presentation",
    type: "Slides",
    date: "2025-02-19",
    source: "Investor relations",
    pages: 38,
  },
  {
    id: "d4",
    title: "Supply agreement summary",
    type: "Contract",
    date: "2024-11-05",
    source: "Internal note",
    pages: 6,
  },
];
