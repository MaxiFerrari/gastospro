import { describe, it, expect } from "vitest";
import {
  computeInitialDueDate,
  advanceDueDate,
  getDueStatus,
  isActionablePending,
  isUpcomingRecurring,
} from "./homeTaskRecurrence";

describe("computeInitialDueDate", () => {
  it("finds next weekly occurrence", () => {
    const monday = new Date(2026, 4, 18);
    expect(computeInitialDueDate("weekly", 0, monday)).toBe("2026-05-24");
  });

  it("finds monthly day in same or next month", () => {
    const from = new Date(2026, 4, 10);
    expect(computeInitialDueDate("monthly", 15, from)).toBe("2026-05-15");
  });
});

describe("advanceDueDate", () => {
  it("adds 7 days for weekly", () => {
    expect(advanceDueDate("weekly", 1, "2026-05-18")).toBe("2026-05-25");
  });

  it("advances monthly", () => {
    expect(advanceDueDate("monthly", 15, "2026-05-15")).toBe("2026-06-15");
  });
});

describe("getDueStatus", () => {
  it("detects overdue and due today", () => {
    const today = new Date(2026, 4, 20);
    expect(
      getDueStatus(
        { recurrence: "weekly", next_due_date: "2026-05-19", done: false },
        today,
      ),
    ).toBe("overdue");
    expect(
      getDueStatus(
        { recurrence: "weekly", next_due_date: "2026-05-20", done: false },
        today,
      ),
    ).toBe("due_today");
    expect(
      getDueStatus(
        { recurrence: "weekly", next_due_date: "2026-05-25", done: false },
        today,
      ),
    ).toBe("upcoming");
  });
});

describe("pending buckets", () => {
  const today = new Date(2026, 4, 20);
  const recurring = {
    recurrence: "weekly",
    next_due_date: "2026-05-25",
    done: false,
  };

  it("upcoming recurring is not actionable", () => {
    expect(isActionablePending(recurring, today)).toBe(false);
    expect(isUpcomingRecurring(recurring, today)).toBe(true);
  });
});
