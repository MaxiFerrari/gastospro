import { describe, it, expect } from "vitest";
import {
  summarizeGuests,
  summarizeBudget,
  checklistProgress,
  getChecklistTemplate,
} from "./eventPartyChecklist";

describe("summarizeGuests", () => {
  it("counts confirmed and pending RSVP", () => {
    const guests = [
      { rsvp: "yes" },
      { rsvp: "yes" },
      { rsvp: "pending" },
      { rsvp: "no" },
    ];
    expect(summarizeGuests(guests)).toEqual({
      confirmed: 2,
      total: 4,
      pendingRsvp: 1,
      declined: 1,
    });
  });
});

describe("summarizeBudget", () => {
  it("returns null budget when no cap", () => {
    expect(summarizeBudget(null, [{ amount: 1000 }])).toMatchObject({
      spent: 1000,
      budget: null,
      over: false,
    });
  });

  it("flags over budget", () => {
    const r = summarizeBudget(5000, [{ amount: 3000 }, { amount: 2500 }]);
    expect(r.spent).toBe(5500);
    expect(r.over).toBe(true);
    expect(r.pct).toBe(110);
  });
});

describe("checklistProgress", () => {
  it("counts done items", () => {
    expect(
      checklistProgress([{ done: true }, { done: false }, { done: true }]),
    ).toEqual({ done: 2, total: 3, pending: 1 });
  });
});

describe("getChecklistTemplate", () => {
  it("returns birthday template", () => {
    expect(getChecklistTemplate("birthday").length).toBe(4);
    expect(getChecklistTemplate("other").length).toBe(3);
  });
});
