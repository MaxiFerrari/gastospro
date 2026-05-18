import { describe, it, expect } from "vitest";
import { inferUnitFromQuantity, getUnitPriceDisplay } from "./productUnits";

describe("productUnits", () => {
  it("parses liters from quantity string", () => {
    const r = inferUnitFromQuantity("1,5 L");
    expect(r.unit).toBe("L");
    expect(r.size).toBe(1.5);
  });

  it("parses ml and converts large to liters", () => {
    const r = inferUnitFromQuantity("500 ml");
    expect(r.unit).toBe("ml");
    expect(r.size).toBe(500);
  });

  it("shows price per liter", () => {
    const d = getUnitPriceDisplay({
      price: 1500,
      unit: "L",
      size: "1.5",
    });
    expect(d?.line).toContain("/ L");
    expect(d?.unitPrice).toBe(1000);
  });

  it("shows price per unit", () => {
    const d = getUnitPriceDisplay({
      price: 800,
      unit: "u",
      size: null,
    });
    expect(d?.line).toContain("/ u");
  });
});
