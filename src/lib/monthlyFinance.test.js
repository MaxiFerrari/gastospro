import { describe, it, expect } from "vitest";
import {
  getPrevMonth,
  filterPrevMonthTransactions,
  getPendingFixedItems,
  getPendingFixedExpenseSummary,
} from "./monthlyFinance.js";

describe("getPrevMonth", () => {
  it("wraps January to prior December", () => {
    expect(getPrevMonth(2025, 0)).toEqual({ year: 2024, month: 11 });
  });
});

describe("filterPrevMonthTransactions", () => {
  it("filters by UTC month", () => {
    const txs = [
      { id: "a", created_at: "2024-12-15T12:00:00.000Z" },
      { id: "b", created_at: "2025-01-15T12:00:00.000Z" },
    ];
    expect(filterPrevMonthTransactions(txs, 2025, 0).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("pending fixed helpers", () => {
  const fixedItems = [
    { id: "fi-1", type: "expense", active: true },
    { id: "fi-2", type: "income", active: true },
  ];

  it("lists fixed items without a transaction this month", () => {
    const monthly = [{ fixed_item_id: "fi-1" }];
    expect(getPendingFixedItems(fixedItems, monthly).map((f) => f.id)).toEqual([
      "fi-2",
    ]);
  });

  it("sums pending expense amounts from previous month", () => {
    const pending = [{ id: "fi-1", type: "expense", active: true }];
    const prev = [{ fixed_item_id: "fi-1", amount: 500 }];
    const summary = getPendingFixedExpenseSummary(pending, prev);
    expect(summary.pendingFixedExpenses).toBe(500);
    expect(summary.pendingExpenseFixedCount).toBe(1);
  });
});
