import { describe, it, expect } from "vitest";
import {
  parsePathname,
  buildPath,
  isHubTabActive,
  isKnownAppPath,
  normalizePathname,
} from "./routes.js";

describe("parsePathname", () => {
  it("parses monthly route with year and month", () => {
    const r = parsePathname("/mensual/2024/6");
    expect(r).toEqual({
      mode: "finance",
      page: "monthly",
      year: 2024,
      month: 5,
    });
  });

  it("parses events mode", () => {
    expect(parsePathname("/eventos").mode).toBe("events");
  });

  it("parses shopping mode", () => {
    expect(parsePathname("/compras").mode).toBe("shopping");
  });

  it("parses shopping context and supermarket mode", () => {
    const r = parsePathname("/compras/super/modo");
    expect(r.mode).toBe("shopping");
    expect(r.shoppingContext).toBe("super");
    expect(r.supermarketMode).toBe(true);
  });

  it("parses lista-super shortcut", () => {
    const r = parsePathname("/lista-super");
    expect(r.mode).toBe("shopping");
    expect(r.supermarketMode).toBe(true);
  });

  it("parses home and me modes", () => {
    expect(parsePathname("/hogar").mode).toBe("home");
    expect(parsePathname("/yo").mode).toBe("me");
  });

  it("parses new-transaction shortcut with openForm", () => {
    const r = parsePathname("/nuevo-gasto");
    expect(r.page).toBe("monthly");
    expect(r.openForm).toBe(true);
  });

  it("returns null for unknown paths", () => {
    expect(parsePathname("/ruta-invalida")).toBeNull();
    expect(parsePathname("/foo/bar")).toBeNull();
  });
});

describe("buildPath", () => {
  it("round-trips monthly path", () => {
    const route = {
      mode: "finance",
      page: "monthly",
      year: 2025,
      month: 0,
    };
    expect(buildPath(route)).toBe("/mensual/2025/1");
    expect(parsePathname("/mensual/2025/1")).toMatchObject(route);
  });

  it("builds events path", () => {
    expect(
      buildPath({ mode: "events", year: 2025, month: 0 }),
    ).toBe("/eventos");
  });

  it("builds shopping paths", () => {
    expect(buildPath({ mode: "shopping" })).toBe("/compras");
    expect(buildPath({ mode: "shopping", shoppingContext: "super" })).toBe(
      "/compras/super",
    );
    expect(
      buildPath({
        mode: "shopping",
        shoppingContext: "super",
        supermarketMode: true,
      }),
    ).toBe("/compras/super/modo");
  });
});

describe("isHubTabActive", () => {
  it("detects finance and shopping tabs", () => {
    expect(isHubTabActive("finance", "/mensual/2025/1")).toBe(true);
    expect(isHubTabActive("shopping", "/compras/super/modo")).toBe(true);
    expect(isHubTabActive("events", "/eventos")).toBe(true);
    expect(isHubTabActive("home", "/hogar")).toBe(true);
    expect(isHubTabActive("me", "/yo")).toBe(true);
    expect(isHubTabActive("finance", "/hogar")).toBe(false);
  });
});

describe("isKnownAppPath", () => {
  it("accepts hub routes and rejects unknown", () => {
    expect(isKnownAppPath("/hogar")).toBe(true);
    expect(isKnownAppPath("/compras/farmacia")).toBe(true);
    expect(isKnownAppPath("/ruta-invalida")).toBe(false);
  });

  it("normalizes trailing slash", () => {
    expect(normalizePathname("/hogar/")).toBe("/hogar");
  });
});
