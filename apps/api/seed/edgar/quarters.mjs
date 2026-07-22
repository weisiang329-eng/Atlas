/**
 * Re-export shim.
 *
 * The implementation moved to src/ingest/edgar-quarters.ts so the Worker's
 * ingest route and this offline seed generator run the SAME code. Keeping a
 * second copy here would let the seeded database and the live API drift apart
 * on what a quarter is — the exact class of bug the differencing logic exists
 * to avoid.
 */
export {
  extractQuarters,
  fiscalQuarterOf,
  reconcileQuarters,
  extractAnnualRevenue,
} from "../../src/ingest/edgar-quarters.ts";
