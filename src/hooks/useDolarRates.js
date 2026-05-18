import { useState, useEffect, useCallback } from "react";
import {
  fetchDolarRates,
  readDolarCache,
  writeDolarCache,
} from "../lib/dolarApi";

export function useDolarRates() {
  const [rates, setRates] = useState(() => readDolarCache());
  const [loading, setLoading] = useState(!readDolarCache());
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDolarRates();
      setRates(data);
      writeDolarCache(data);
    } catch (e) {
      setError(e.message ?? "Cotización no disponible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rates) refresh();
  }, [rates, refresh]);

  return { rates, loading, error, refresh };
}
