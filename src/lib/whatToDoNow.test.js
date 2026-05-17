import { describe, it, expect } from "vitest";
import { pickWhatToDoNow } from "./whatToDoNow";

describe("pickWhatToDoNow", () => {
  it("prioritizes event today", () => {
    const r = pickWhatToDoNow({
      nextEvent: { event: { title: "Cumple Ana" }, days: 0 },
      pendingTasks: [{ title: "Lavar" }],
    });
    expect(r.mode).toBe("events");
    expect(r.title).toContain("Hoy");
  });

  it("suggests low stock before tasks when no urgent event", () => {
    const r = pickWhatToDoNow({
      lowStock: [{ name: "Leche" }],
      pendingTasks: [{ title: "Lavar" }],
    });
    expect(r.mode).toBe("shopping");
    expect(r.title).toContain("Leche");
  });

  it("opens supermarket when only shopping pending", () => {
    const r = pickWhatToDoNow({
      pendingShoppingCount: 3,
    });
    expect(r.openSupermarket).toBe(true);
  });
});
