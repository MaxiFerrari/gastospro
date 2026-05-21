import { describe, it, expect } from "vitest";
import {
  parseNominatimResult,
  parseNominatimResults,
} from "./nominatimGeocode.js";

describe("parseNominatimResult", () => {
  it("parses search result with name", () => {
    const r = parseNominatimResult({
      name: "Obelisco",
      display_name: "Obelisco, Buenos Aires, Argentina",
      lat: "-34.6037",
      lon: "-58.3816",
    });
    expect(r).toEqual({
      name: "Obelisco",
      address: "Obelisco, Buenos Aires, Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    });
  });

  it("falls back to first part of display_name", () => {
    const r = parseNominatimResult({
      display_name: "Plaza de Mayo, CABA, Argentina",
      lat: "-34.6083",
      lon: "-58.3712",
    });
    expect(r?.name).toBe("Plaza de Mayo");
  });

  it("returns null for invalid coords", () => {
    expect(parseNominatimResult({ lat: "x", lon: "1" })).toBeNull();
    expect(parseNominatimResult(null)).toBeNull();
  });
});

describe("parseNominatimResults", () => {
  it("limits and filters results", () => {
    const rows = [
      { name: "A", lat: "1", lon: "2" },
      { lat: "bad", lon: "2" },
      { name: "B", lat: "3", lon: "4" },
      { name: "C", lat: "5", lon: "6" },
    ];
    expect(parseNominatimResults(rows, 2)).toHaveLength(2);
  });
});
