import { describe, it, expect } from "vitest";
import { parseReceiptText } from "./receiptOcr";

describe("parseReceiptText", () => {
  it("extracts items with Argentine prices", () => {
    const text = `SUPERMERCADO XYZ
LECHE 1L    2.450
PAN LACTAL   3.100
TOTAL 5.550`;
    const { items } = parseReceiptText(text);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].name).toMatch(/leche/i);
    expect(items[0].price).toBe(2450);
  });

  it("skips total lines", () => {
    const { items } = parseReceiptText("TOTAL 999\nIVA 21%");
    expect(items).toHaveLength(0);
  });

  it("parses quantity prefix", () => {
    const { items } = parseReceiptText("2x YOGUR 500G 1.200");
    expect(items[0].quantity).toBe(2);
    expect(items[0].name).toMatch(/yogur/i);
  });
});
