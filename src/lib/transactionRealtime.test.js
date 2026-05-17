import { describe, it, expect } from "vitest";
import { applyTransactionRealtimeEvent } from "./transactionRealtime.js";

const range = {
  from: "2025-01-01T00:00:00.000Z",
  to: "2025-12-31T23:59:59.999Z",
};

describe("applyTransactionRealtimeEvent", () => {
  it("inserts a new row in range", () => {
    const prev = [];
    const next = applyTransactionRealtimeEvent(
      prev,
      {
        eventType: "INSERT",
        new: {
          id: "tx-1",
          created_at: "2025-06-15T12:00:00.000Z",
          amount: 100,
        },
      },
      range,
    );
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("tx-1");
  });

  it("ignores duplicate ids", () => {
    const prev = [{ id: "tx-1", created_at: "2025-06-15T12:00:00.000Z" }];
    const next = applyTransactionRealtimeEvent(
      prev,
      {
        eventType: "INSERT",
        new: { id: "tx-1", created_at: "2025-06-15T12:00:00.000Z" },
      },
      range,
    );
    expect(next).toHaveLength(1);
  });

  it("updates existing row", () => {
    const prev = [{ id: "tx-1", amount: 50 }];
    const next = applyTransactionRealtimeEvent(
      prev,
      { eventType: "UPDATE", new: { id: "tx-1", amount: 99 } },
      range,
    );
    expect(next[0].amount).toBe(99);
  });

  it("removes deleted row", () => {
    const prev = [{ id: "tx-1" }, { id: "tx-2" }];
    const next = applyTransactionRealtimeEvent(
      prev,
      { eventType: "DELETE", old: { id: "tx-1" } },
      range,
    );
    expect(next.map((t) => t.id)).toEqual(["tx-2"]);
  });

  it("skips insert outside fetch range", () => {
    const next = applyTransactionRealtimeEvent(
      [],
      {
        eventType: "INSERT",
        new: { id: "tx-old", created_at: "2020-01-01T00:00:00.000Z" },
      },
      range,
    );
    expect(next).toHaveLength(0);
  });
});
