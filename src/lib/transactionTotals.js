/**
 * Card / off-books expenses: kept for detail (amount, installments) but not summed
 * into monthly or yearly totals — the real cash impact is the fixed card payment.
 */
export function countsInMonthlyTotals(transaction) {
  return transaction.exclude_from_totals !== true;
}
