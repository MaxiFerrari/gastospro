/**
 * Pure helpers for monthly finance (testable without React).
 */

export function getPrevMonth(year, month) {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function filterPrevMonthTransactions(transactions, year, month) {
  const { year: py, month: pm } = getPrevMonth(year, month);
  return transactions.filter((t) => {
    const d = new Date(t.created_at);
    return d.getUTCMonth() === pm && d.getUTCFullYear() === py;
  });
}

export function getPendingFixedItems(fixedItems, monthlyTransactions) {
  return fixedItems.filter(
    (fi) =>
      fi.active !== false &&
      !monthlyTransactions.some((t) => t.fixed_item_id === fi.id),
  );
}

export function getPendingFixedExpenseSummary(pendingFixedItems, prevMonthTransactions) {
  const prevAmountMap = new Map(
    prevMonthTransactions
      .filter((t) => t.fixed_item_id != null)
      .map((t) => [t.fixed_item_id, t.amount]),
  );
  const expenseItems = pendingFixedItems.filter((fi) => fi.type === "expense");
  const total = expenseItems.reduce(
    (sum, fi) => sum + (prevAmountMap.get(fi.id) ?? 0),
    0,
  );
  return {
    pendingFixedExpenses: total,
    pendingExpenseFixedCount: expenseItems.length,
  };
}
