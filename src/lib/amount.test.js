import { describe, it, expect } from "vitest";
import { parseAmount, formatAmount, formatCurrency } from "./amount.js";

describe("parseAmount", () => {
  it("parses thousands with dot and decimal comma", () => {
    expect(parseAmount("1.500,50")).toBe(1500.5);
  });

  it("parses comma decimal only", () => {
    expect(parseAmount("1500,50")).toBe(1500.5);
  });

  it("parses thousands with single dot", () => {
    expect(parseAmount("1.500")).toBe(1500);
  });

  it("parses plain integer", () => {
    expect(parseAmount("1500")).toBe(1500);
  });

  it("returns null for empty or non-positive", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
  });

  it("accepts numeric input", () => {
    expect(parseAmount(42)).toBe(42);
  });
});

describe("formatAmount", () => {
  it("formats with thousands dot and decimal comma", () => {
    expect(formatAmount(1500.5)).toBe("1.500,5");
  });

  it("formats integer without decimals", () => {
    expect(formatAmount(1500)).toBe("1.500");
  });

  it("returns empty string for nullish", () => {
    expect(formatAmount(null)).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats ARS currency", () => {
    expect(formatCurrency(1000)).toMatch(/\$|ARS/);
    expect(formatCurrency(1000)).toContain("1");
  });
});
