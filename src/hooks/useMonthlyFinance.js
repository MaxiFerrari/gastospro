import { useMemo } from "react";
import { sortMonthlyTransactions } from "../lib/sort";
import { monthAnchorIso, monthAnchorNextIso } from "../lib/dates";

export function useMonthlyFinance({
  transactions,
  fixedItems,
  filterTransactions,
  year,
  month,
  isCurrentMonth,
}) {
  const monthlyTransactions = useMemo(
    () => sortMonthlyTransactions(filterTransactions(transactions), fixedItems),
    [transactions, fixedItems, filterTransactions],
  );

  const prevMonthTransactions = useMemo(() => {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    return transactions.filter((t) => {
      const d = new Date(t.created_at);
      return d.getUTCMonth() === pm && d.getUTCFullYear() === py;
    });
  }, [transactions, year, month]);

  const pendingFixedItems = useMemo(
    () =>
      fixedItems.filter(
        (fi) =>
          fi.active !== false &&
          !monthlyTransactions.some((t) => t.fixed_item_id === fi.id),
      ),
    [fixedItems, monthlyTransactions],
  );

  const { pendingFixedExpenses, pendingExpenseFixedCount } = useMemo(() => {
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
  }, [pendingFixedItems, prevMonthTransactions]);

  function createdAtForNewTransaction(excludeFromTotals) {
    if (excludeFromTotals) return monthAnchorNextIso(year, month);
    if (isCurrentMonth) return undefined;
    return monthAnchorIso(year, month);
  }

  return {
    monthlyTransactions,
    prevMonthTransactions,
    pendingFixedItems,
    pendingFixedExpenses,
    pendingExpenseFixedCount,
    createdAtForNewTransaction,
  };
}
