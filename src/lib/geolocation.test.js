import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAccuratePosition } from "./geolocation.js";

/** @type {Geolocation | undefined} */
let originalGeolocation;

function mockGeolocation(/** @type {Partial<Geolocation>} */ impl) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
      ...impl,
    },
  });
}

describe("getAccuratePosition", () => {
  beforeEach(() => {
    originalGeolocation = navigator.geolocation;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalGeolocation) {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: originalGeolocation,
      });
    }
  });

  it("rejects when geolocation is unavailable", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
    await expect(getAccuratePosition()).rejects.toThrow(
      "Ubicación no disponible",
    );
  });

  it("resolves with the best reading before timeout", async () => {
    /** @type {PositionCallback | null} */
    let watchCb = null;
    mockGeolocation({
      watchPosition: vi.fn((cb) => {
        watchCb = cb;
        return 1;
      }),
      clearWatch: vi.fn(),
    });

    const promise = getAccuratePosition({ timeout: 5000, desiredAccuracy: 5 });

    watchCb?.({
      coords: { latitude: -34.6, longitude: -58.38, accuracy: 120 },
    });
    watchCb?.({
      coords: { latitude: -34.601, longitude: -58.381, accuracy: 25 },
    });

    vi.advanceTimersByTime(5000);

    await expect(promise).resolves.toEqual({
      latitude: -34.601,
      longitude: -58.381,
      accuracy: 25,
    });
  });

  it("resolves early when desired accuracy is reached", async () => {
    mockGeolocation({
      watchPosition: vi.fn((cb) => {
        cb({
          coords: { latitude: -34.6037, longitude: -58.3816, accuracy: 10 },
        });
        return 2;
      }),
      clearWatch: vi.fn(),
    });

    await expect(getAccuratePosition()).resolves.toEqual({
      latitude: -34.6037,
      longitude: -58.3816,
      accuracy: 10,
    });
  });
});
