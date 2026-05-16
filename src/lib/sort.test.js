import { describe, it, expect } from "vitest";
import { sortMonthlyTransactions } from "./sort.js";

const d = (iso) => ({ created_at: iso });

describe("sortMonthlyTransactions", () => {
  const fixedItems = [
    { id: "fi-1", sort_order: 2 },
    { id: "fi-2", sort_order: 0 },
  ];

  it("orders by explicit sort_order first", () => {
    const txs = [
      { id: "b", sort_order: 1, created_at: "2025-01-02" },
      { id: "a", sort_order: 0, created_at: "2025-01-01" },
    ];
    expect(sortMonthlyTransactions(txs, []).map((t) => t.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("uses fixed_item sort_order when transaction sort_order is missing", () => {
    const txs = [
      { id: "t1", fixed_item_id: "fi-1", created_at: "2025-01-01" },
      { id: "t2", fixed_item_id: "fi-2", created_at: "2025-01-02" },
    ];
    expect(sortMonthlyTransactions(txs, fixedItems).map((t) => t.id)).toEqual([
      "t2",
      "t1",
    ]);
  });

  it("puts manual items after fixed items, newest first", () => {
    const txs = [
      { id: "manual-old", created_at: "2025-01-01T10:00:00Z" },
      { id: "manual-new", created_at: "2025-01-05T10:00:00Z" },
      { id: "fixed", fixed_item_id: "fi-2", created_at: "2025-01-03" },
    ];
    expect(sortMonthlyTransactions(txs, fixedItems).map((t) => t.id)).toEqual([
      "fixed",
      "manual-new",
      "manual-old",
    ]);
  });

  it("does not mutate the input array", () => {
    const txs = [d("2025-01-01"), d("2025-01-02")];
    const copy = [...txs];
    sortMonthlyTransactions(txs, []);
    expect(txs).toEqual(copy);
  });
});
