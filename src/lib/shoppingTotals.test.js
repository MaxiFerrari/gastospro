import { describe, it, expect } from "vitest";
import { computeShoppingTotals, itemLineTotal } from "./shoppingTotals";

describe("shoppingTotals", () => {
  it("sums pending and completed by price", () => {
    const items = [
      { price: 1000, quantity: 2, completed: false },
      { price: 500, quantity: 1, completed: true },
      { price: null, quantity: 1, completed: false },
    ];
    const { toPay, paid, pricedCount } = computeShoppingTotals(items);
    expect(toPay).toBe(2000);
    expect(paid).toBe(500);
    expect(pricedCount).toBe(2);
  });

  it("parses AR price strings", () => {
    expect(itemLineTotal({ price: "1.500", quantity: 1 })).toBe(1500);
  });
});
