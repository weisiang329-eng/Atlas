/**
 * Statement renderer — projects canonical facts into the frontend's
 * `StatementRow[]` presentation (label / values / kind / indent), one value
 * column per period, oldest -> newest.
 *
 * Rows whose concept is missing in EVERY period are dropped (rather than
 * rendered as a row of nulls) so sparse coverage degrades gracefully; section
 * headers always render. Missing values inside a kept row are `null`, which the
 * UI shows as "—".
 */
import type { FactMap, RowSpec } from "./concepts";
import {
  BALANCE_SHEET_SPEC,
  CASHFLOW_SPEC,
  INCOME_STATEMENT_SPEC,
} from "./concepts";

/** Mirror of apps/web `StatementRow` with explicit nulls for missing values. */
export interface StatementRowDto {
  label: string;
  values: (number | null)[];
  kind?: "section" | "total";
  indent?: boolean;
}

export type StatementType = "income-statement" | "balance-sheet" | "cash-flow";

const SPECS: Record<StatementType, RowSpec[]> = {
  "income-statement": INCOME_STATEMENT_SPEC,
  "balance-sheet": BALANCE_SHEET_SPEC,
  "cash-flow": CASHFLOW_SPEC,
};

export function isStatementType(s: string): s is StatementType {
  return s in SPECS;
}

function rowValue(spec: RowSpec, facts: FactMap): number | null {
  if (spec.compute) {
    const v = spec.compute(facts);
    return v === undefined ? null : v;
  }
  if (spec.concept) {
    const v = facts[spec.concept];
    if (v === undefined) return null;
    return (spec.sign ?? 1) * v;
  }
  return null;
}

/** Render one statement across `periods` (fact maps, oldest -> newest). */
export function renderStatement(
  type: StatementType,
  periods: FactMap[],
): StatementRowDto[] {
  const rows: StatementRowDto[] = [];
  for (const spec of SPECS[type]) {
    // Section headers carry no values by contract.
    if (!spec.concept && !spec.compute) {
      rows.push({ label: spec.label, kind: "section", values: [] });
      continue;
    }
    const values = periods.map((f) => rowValue(spec, f));
    if (values.every((v) => v === null)) continue;
    rows.push({
      label: spec.label,
      values,
      ...(spec.kind ? { kind: spec.kind } : {}),
      ...(spec.indent ? { indent: true } : {}),
    });
  }
  // Drop sections whose entire body was dropped (header followed by header/end).
  return rows.filter(
    (r, i) =>
      r.kind !== "section" ||
      (rows[i + 1] !== undefined && rows[i + 1]!.kind !== "section"),
  );
}
