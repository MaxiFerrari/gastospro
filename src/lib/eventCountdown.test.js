import { describe, it, expect } from "vitest";
import {
  getNextOccurrenceDate,
  getNextUpcomingEvent,
  formatCountdown,
  parseEventDateLocal,
} from "./eventCountdown";

describe("eventCountdown", () => {
  const today = new Date(2026, 4, 16); // 16 May 2026

  it("rolls birthday to next year when passed", () => {
    const next = getNextOccurrenceDate(
      { event_date: "2026-03-01", kind: "birthday" },
      today,
    );
    expect(next?.getFullYear()).toBe(2027);
    expect(next?.getMonth()).toBe(2);
  });

  it("keeps birthday later this year", () => {
    const next = getNextOccurrenceDate(
      { event_date: "1990-08-20", kind: "birthday" },
      today,
    );
    expect(next?.getFullYear()).toBe(2026);
    expect(next?.getMonth()).toBe(7);
  });

  it("ignores one-time past events", () => {
    const next = getNextOccurrenceDate(
      { event_date: "2025-01-01", kind: "other" },
      today,
    );
    expect(next).toBeNull();
  });

  it("picks nearest upcoming", () => {
    const events = [
      { id: "1", title: "Lejos", event_date: "2026-12-01", kind: "birthday" },
      { id: "2", title: "Cerca", event_date: "2026-05-20", kind: "other" },
    ];
    const best = getNextUpcomingEvent(events, today);
    expect(best?.event.title).toBe("Cerca");
    expect(best?.days).toBe(4);
  });

  it("formats countdown labels", () => {
    expect(formatCountdown(0)).toBe("Hoy");
    expect(formatCountdown(1)).toBe("Mañana");
    expect(formatCountdown(3)).toBe("En 3 días");
  });
});
