import { describe, it, expect } from "vitest";
import {
  normalizeGoogleCalendarItem,
  formatGoogleEventWhen,
} from "./googleCalendar";

describe("normalizeGoogleCalendarItem", () => {
  it("maps timed events", () => {
    const ev = normalizeGoogleCalendarItem({
      id: "abc",
      status: "confirmed",
      summary: "Reunión",
      start: { dateTime: "2026-05-20T15:00:00-03:00" },
      end: { dateTime: "2026-05-20T16:00:00-03:00" },
      htmlLink: "https://calendar.google.com/event",
    });
    expect(ev?.title).toBe("Reunión");
    expect(ev?.allDay).toBe(false);
    expect(ev?.htmlLink).toContain("calendar.google.com");
  });

  it("maps all-day events", () => {
    const ev = normalizeGoogleCalendarItem({
      id: "x",
      status: "confirmed",
      summary: "Feriado",
      start: { date: "2026-05-25" },
      end: { date: "2026-05-26" },
    });
    expect(ev?.allDay).toBe(true);
    expect(ev?.start.getMonth()).toBe(4);
  });

  it("skips cancelled", () => {
    expect(
      normalizeGoogleCalendarItem({ id: "1", status: "cancelled" }),
    ).toBeNull();
  });
});

describe("formatGoogleEventWhen", () => {
  it("labels all-day", () => {
    const d = new Date(2026, 4, 20);
    expect(formatGoogleEventWhen(d, true)).toContain("Todo el día");
  });
});
