/** UTC bounds for a calendar month (inclusive). */
export function monthUtcBounds(year, month) {
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Supabase `created_at` range for the active finance view.
 * - Monthly views: previous month through month+1 (installments / card timing).
 * - Annual tab: last several years for AnnualView's year navigator.
 */
export function getTransactionFetchRange(year, month, page) {
  if (page === "annual") {
    const endYear = new Date().getUTCFullYear();
    return {
      from: new Date(Date.UTC(endYear - 5, 0, 1)).toISOString(),
      to: new Date(Date.UTC(endYear, 11, 31, 23, 59, 59, 999)).toISOString(),
    };
  }

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const { start: from } = monthUtcBounds(prevYear, prevMonth);
  // Through 12 months ahead so installments and card timing stay in sync.
  const to = new Date(Date.UTC(year, month + 13, 0, 23, 59, 59, 999)).toISOString();
  return { from, to };
}

/** 15th of month at noon UTC — stable month assignment across timezones. */
export function monthAnchorIso(year, month) {
  return new Date(Date.UTC(year, month, 15, 12, 0, 0)).toISOString();
}

/** First impact of card / installments starts the month after the selected one. */
export function monthAnchorNextIso(year, month) {
  return new Date(Date.UTC(year, month + 1, 15, 12, 0, 0)).toISOString();
}
