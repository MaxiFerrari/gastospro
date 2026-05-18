import { useState, useEffect, useRef } from "react";
import { fetchWeatherBundle } from "../lib/weather";
import { toast } from "../lib/toast";

const CACHE_KEY = "gastospro:weatherCache";
const CACHE_MS = 45 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Open-Meteo + geolocalización (sin API key).
 */
export function useWeather() {
  const [weather, setWeather] = useState(() => readCache());
  const [loading, setLoading] = useState(!readCache());
  const [error, setError] = useState(null);
  const apiErrorNotified = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load(lat, lon) {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherBundle(lat, lon);
        if (!cancelled) {
          setWeather(data);
          writeCache(data);
          apiErrorNotified.current = false;
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e.message ?? "Clima no disponible";
          setError(msg);
          if (!apiErrorNotified.current) {
            toast(msg, "error");
            apiErrorNotified.current = true;
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const cached = readCache();
    if (cached) {
      setWeather(cached);
      setLoading(false);
    }

    if (!navigator.geolocation) {
      setError("Ubicación no disponible");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        load(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        if (!cached) {
          setError("Activá ubicación para ver el clima");
          setLoading(false);
        }
      },
      { timeout: 8000, maximumAge: CACHE_MS },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, loading, error };
}
