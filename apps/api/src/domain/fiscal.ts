/**
 * Fiscal calendars → calendar quarters.
 *
 * Every cross-company quarterly comparison depends on this and nothing else:
 * NVIDIA's FY26 Q1 ends in April, Intel's Q1 ends in March, Micron's FY24 Q1
 * ends in November. Comparing "Q1" to "Q1" across them is comparing different
 * three-month windows, and an industry margin built that way is an artefact.
 *
 * The problem this exists to fix: the EDGAR seed writes 402 quarterly periods
 * with `fiscal_year` and `fiscal_quarter` but **no `report_date`** — the
 * column is not in the INSERT at all, in the seed or in the ingest route. So
 * every US industry's quarterly history was silently empty: `quarterOf(null)`
 * returns nothing, no rows survive, and the driver backtest reported
 * "insufficient data" for a reason that had nothing to do with the data.
 *
 * Two ways out, and the difference matters:
 *
 * - **Where SEC gave us the period end, store it.** The ingest route now
 *   writes `report_date` from the filing. That is a fact.
 * - **Where it is missing, DERIVE the calendar quarter — never a date.**
 *   Fiscal quarters end three months apart from the fiscal year end, so
 *   (fy, q, fyEndMonth) determines the calendar quarter by arithmetic. The
 *   result is marked `derived` and no invented date is written to a column
 *   that means "when this was reported".
 */

/**
 * The calendar quarter a fiscal quarter ends in.
 *
 * Assumes fiscal quarters end three months apart from the fiscal year end,
 * which is true by construction. Companies on a 52/53-week calendar can end a
 * few days either side of the month boundary (NVIDIA's Q1 FY19 ended
 * 2018-04-29); that moves the day, not the quarter, in every case Atlas
 * covers. Where SEC's real end date is available it is used instead of this.
 */
export function calendarQuarterOfFiscal(
  fiscalYear: number,
  fiscalQuarter: number,
  fyEndMonth: number,
): string | null {
  if (
    !Number.isInteger(fiscalYear) ||
    fiscalQuarter < 1 ||
    fiscalQuarter > 4 ||
    fyEndMonth < 1 ||
    fyEndMonth > 12
  ) {
    return null;
  }

  let month = fyEndMonth - (4 - fiscalQuarter) * 3;
  let year = fiscalYear;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  return `${year}Q${Math.floor((month - 1) / 3) + 1}`;
}

/** Calendar quarter of an ISO date. */
export function calendarQuarterOfDate(isoDate: string): string | null {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

export interface PeriodPlacement {
  quarter: string | null;
  /** True when the quarter came from arithmetic rather than a filed date. */
  derived: boolean;
}

/**
 * Place a period on the calendar. Prefers the filed date; falls back to the
 * fiscal calendar; gives up rather than guessing when neither is available.
 */
export function placePeriod(
  period: {
    reportDate: string | null;
    fiscalYear: number | null;
    fiscalQuarter: number | null;
  },
  fyEndMonth: number | null,
): PeriodPlacement {
  if (period.reportDate) {
    const q = calendarQuarterOfDate(period.reportDate);
    if (q) return { quarter: q, derived: false };
  }
  if (
    fyEndMonth !== null &&
    period.fiscalYear !== null &&
    period.fiscalQuarter !== null
  ) {
    return {
      quarter: calendarQuarterOfFiscal(
        period.fiscalYear,
        period.fiscalQuarter,
        fyEndMonth,
      ),
      derived: true,
    };
  }
  // A company with no fiscal-year end recorded and no filed date cannot be
  // placed. Dropping it is correct; putting it in "some" quarter is not.
  return { quarter: null, derived: false };
}
