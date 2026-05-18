import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchDolarRates,
  readDolarCache,
  writeDolarCache,
} from "../lib/dolarApi";
import { toast } from "../lib/toast";

/**
 * @param {{ notifyErrors?: boolean }} [options]
 */
export function useDolarRates(options = {}) {
  const { notifyErrors = false } = options;
  const [rates, setRates] = useState(() => readDolarCache());
  const [loading, setLoading] = useState(!readDolarCache());
  const [error, setError] = useState(null);
  const notifiedRef = useRef(false);

  const refresh = useCallback(
    async (opts = {}) => {
      const shouldNotify = opts.notify ?? notifyErrors;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDolarRates();
        setRates(data);
        writeDolarCache(data);
        notifiedRef.current = false;
      } catch (e) {
        const msg = e.message ?? "Cotización no disponible";
        setError(msg);
        if (shouldNotify) toast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [notifyErrors],
  );

  useEffect(() => {
    if (!rates) {
      refresh({ notify: notifyErrors && !notifiedRef.current });
      if (notifyErrors) notifiedRef.current = true;
    }
  }, [rates, refresh, notifyErrors]);

  return { rates, loading, error, refresh };
}
