# Atlas Report UX v0.1 (ATLAS-UI-P002)

Atlas reports are **decision documents**, not exports. Every report is built to
answer five questions for founders, executives, analysts, board members and
operators:

1. What changed?
2. Why did it change?
3. Who is affected?
4. What evidence supports this?
5. What decision should be considered next?

These five are surfaced explicitly in the Executive Summary's **decision lens**.

## Report types

Nine types share one structure and one component set:

| Type | Slug |
| --- | --- |
| Company Intelligence Report | `company-intelligence` |
| Industry Intelligence Report | `industry-intelligence` |
| Investment Research Report | `investment-research` |
| Financial Analysis Report | `financial-analysis` |
| Supply Chain Report | `supply-chain` |
| M&A Target Report | `ma-target` |
| Board Pack | `board-pack` |
| Weekly Intelligence Brief | `weekly-brief` |
| Decision Memo | `decision-memo` |

Routes: `/reports` (library) and `/reports/[reportId]` (document). Report pages
are statically generated from the mock set.

## Core structure

Every report renders these sections in order: Executive Summary · Key Findings ·
Evidence · Sources · Risks · Opportunities · Assumptions · Open Questions ·
Recommendations · Decision Log · Appendix · Version History.

## Component structure

`ReportLayout` is the composition root — it renders the whole document from a
`ReportModel` using the reusable pieces, plus a table of contents:

| Component | Section |
| --- | --- |
| `ReportHeader` | Masthead (type, title, subject, meta chips) |
| `ExportToolbar` | Print (browser) + disabled PDF/Share — client island |
| `ExecutiveSummaryCard` | Summary + 5-question decision lens |
| `KeyFindingsList` | Impact-tagged findings |
| `EvidenceTable` | Claim → source → confidence |
| `SourceList` | Source register |
| `RiskMatrix` | Likelihood × impact grid + list |
| `RecommendationBlock` | Actions with priority + owner |
| `DecisionMemoSection` | Decision log table |
| `AppendixSection` | Collapsible appendix |
| `VersionHistoryPanel` | Version history |

All are server-rendered except `ExportToolbar`. Colours come from design tokens,
so reports are dark-mode compatible and, via the print stylesheet, render as a
clean light document for paper and print-to-PDF.

## Mock data

`lib/mock/reports.ts` holds a `ReportModel` type and nine fictional reports. No
real companies, no sourced facts, no generated content. Every view is labelled
"Mock report". This is the only thing to replace when backends land.

## Future backend dependencies

- A **reports service** (list + fetch a `ReportModel` by id + version) behind the
  `lib/api` seam. `ReportModel` is the wire contract to align with Codex.
- **Document/storage** for the source and appendix artefacts (DocumentViewer
  preview).
- **Versioning** persistence for the version history and decision log.
- Wiring path stays `loader → Resource<ReportModel> → <DataState>`; no component
  changes.

## Future AI-generation dependencies

- A generation service produces a `ReportModel` (draft), section by section, with
  every claim carrying source metadata — the Evidence table is the contract that
  keeps generated reports auditable.
- Human review gates `Draft → In review → Final` (already modelled in `status`).
- Out of scope now: generation, PDF export pipeline, email, sharing, permissions.
