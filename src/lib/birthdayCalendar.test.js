import { describe, it, expect } from "vitest";
import { groupBirthdaysByMonth } from "./birthdayCalendar";

describe("groupBirthdaysByMonth", () => {
  it("groups only birthday kind by month", () => {
    const year = new Date().getFullYear();
    const months = groupBirthdaysByMonth(
      [
        { id: "1", title: "Ana", event_date: "1990-03-15", kind: "birthday" },
        { id: "2", title: "Fiesta", event_date: "2025-06-01", kind: "other" },
        { id: "3", title: "Luis", event_date: "1985-03-20", kind: "birthday" },
      ],
      year,
    );
    expect(months[2].items).toHaveLength(2);
    expect(months[5].items).toHaveLength(0);
  });
});
