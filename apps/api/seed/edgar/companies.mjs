/**
 * Re-export shim.
 *
 * The roster and tag map moved to src/ingest/edgar-tags.ts so the Worker's
 * ingest route and this offline generator resolve "Revenue" through the SAME
 * tag-priority list. Two copies is two chances for the live API and the
 * seeded database to disagree about what a concept means.
 */
export {
  EDGAR_COMPANIES,
  TAG_MAP,
  CASH_ADDONS,
  GOODWILL_PARTS,
  DURATION_CONCEPTS,
  NON_ADDITIVE_CONCEPTS,
} from "../../src/ingest/edgar-tags.ts";
