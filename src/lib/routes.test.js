import { describe, it, expect } from "vitest";
import { parsePathname, buildPath } from "./routes.js";

describe("parsePathname", () => {
  it("parses monthly route with year and month", () => {
    const r = parsePathname("/mensual/2024/6");
    expect(r).toEqual({
      shell: "finance",
      page: "monthly",
      year: 2024,
      month: 5,
    });
  });

  it("parses events shell", () => {
    expect(parsePathname("/eventos").shell).toBe("events");
  });

  it("parses shopping page", () => {
    expect(parsePathname("/compras").page).toBe("shopping");
  });

  it("parses new-transaction shortcut with openForm", () => {
    const r = parsePathname("/nuevo-gasto");
    expect(r.page).toBe("monthly");
    expect(r.openForm).toBe(true);
  });
});

describe("buildPath", () => {
  it("round-trips monthly path", () => {
    const route = { shell: "finance", page: "monthly", year: 2025, month: 0 };
    expect(buildPath(route)).toBe("/mensual/2025/1");
    expect(parsePathname("/mensual/2025/1")).toMatchObject(route);
  });

  it("builds events path", () => {
    expect(buildPath({ shell: "events", page: "monthly", year: 2025, month: 0 })).toBe(
      "/eventos",
    );
  });
});
