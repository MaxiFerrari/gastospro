import { useState, useCallback } from "react";

const KEY = "gp_usd_rate";
const DEFAULT = 1200;

export function useExchangeRate() {
  const [rate, setRateState] = useState(() => {
    const s = localStorage.getItem(KEY);
    return s ? Number(s) : DEFAULT;
  });

  const setRate = useCallback((val) => {
    const n = Number(val);
    if (n > 0) {
      localStorage.setItem(KEY, String(n));
      setRateState(n);
    }
  }, []);

  return { rate, setRate };
}
