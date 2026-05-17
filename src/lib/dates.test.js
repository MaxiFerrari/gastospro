import { describe, it, expect } from "vitest";
import {
  monthUtcBounds,
  getTransactionFetchRange,
  monthAnchorIso,
  monthAnchorNextIso,
} from "./dates.js";

describe("monthUtcBounds", () => {
  it("returns UTC start and end of month", () => {
    const { start, end } = monthUtcBounds(2025, 0);
    expect(start).toBe("2025-01-01T00:00:00.000Z");
    expect(end).toBe("2025-01-31T23:59:59.999Z");
  });
});

describe("getTransactionFetchRange", () => {
  it("returns multi-year span for annual page", () => {
    const endYear = new Date().getUTCFullYear();
    const { from, to } = getTransactionFetchRange(2025, 3, "annual");
    expect(from).toBe(new Date(Date.UTC(endYear - 5, 0, 1)).toISOString());
    expect(to).toContain(String(endYear));
  });

  it("includes previous month and forward buffer for monthly page", () => {
    const { from, to } = getTransactionFetchRange(2025, 0, "monthly");
    expect(from).toBe("2024-12-01T00:00:00.000Z");
    expect(new Date(to).getTime()).toBeGreaterThan(
      new Date("2025-12-31T00:00:00.000Z").getTime(),
    );
  });

  it("wraps January previous month to December prior year", () => {
    const { from } = getTransactionFetchRange(2025, 0, "monthly");
    expect(from.startsWith("2024-12")).toBe(true);
  });
});

describe("monthAnchorIso", () => {
  it("anchors on the 15th at noon UTC", () => {
    expect(monthAnchorIso(2025, 3)).toBe("2025-04-15T12:00:00.000Z");
  });
});

describe("monthAnchorNextIso", () => {
  it("anchors on the 15th of the following month", () => {
    expect(monthAnchorNextIso(2025, 3)).toBe("2025-05-15T12:00:00.000Z");
  });
});
