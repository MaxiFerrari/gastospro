import { describe, it, expect } from "vitest";
import { formatApiError, httpStatusMessage } from "./apiErrors";

describe("apiErrors", () => {
  it("formats network errors", () => {
    const msg = formatApiError("dolar", new TypeError("Failed to fetch"));
    expect(msg).toMatch(/Sin conexión/i);
    expect(msg).toMatch(/dólar/i);
  });

  it("formats HTTP 500", () => {
    const msg = httpStatusMessage("weather", { status: 503 });
    expect(msg).toMatch(/503/);
  });
});
