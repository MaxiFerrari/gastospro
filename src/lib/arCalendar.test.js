import { describe, it, expect } from "vitest";
import {
  getUpcomingHolidays,
  getNextPlanningHighlight,
  formatPlanningDays,
} from "./arCalendar";
import { localTodayMidnight } from "./eventCountdown";

describe("arCalendar", () => {
  it("returns holidays on or after today", () => {
    const today = localTodayMidnight();
    const list = getUpcomingHolidays(today, { daysAhead: 400 });
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].dateObj.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  it("formatPlanningDays handles today", () => {
    expect(formatPlanningDays(0)).toBe("Hoy");
    expect(formatPlanningDays(1)).toBe("Mañana");
  });

  it("getNextPlanningHighlight returns object or null", () => {
    const h = getNextPlanningHighlight(localTodayMidnight());
    if (h) {
      expect(h.title).toBeTruthy();
      expect(["holiday", "school_break_start"]).toContain(h.kind);
    }
  });
});
