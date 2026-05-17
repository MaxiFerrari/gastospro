import { useMemo } from "react";
import { sortMonthlyTransactions } from "../lib/sort";
import { monthAnchorIso, monthAnchorNextIso } from "../lib/dates";
import {
  filterPrevMonthTransactions,
  getPendingFixedItems,
  getPendingFixedExpenseSummary,
} from "../lib/monthlyFinance";

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

  const prevMonthTransactions = useMemo(
    () => filterPrevMonthTransactions(transactions, year, month),
    [transactions, year, month],
  );

  const pendingFixedItems = useMemo(
    () => getPendingFixedItems(fixedItems, monthlyTransactions),
    [fixedItems, monthlyTransactions],
  );

  const { pendingFixedExpenses, pendingExpenseFixedCount } = useMemo(
    () => getPendingFixedExpenseSummary(pendingFixedItems, prevMonthTransactions),
    [pendingFixedItems, prevMonthTransactions],
  );

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
