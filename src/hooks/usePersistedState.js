import { useState, useEffect, useCallback, useRef } from "react";

/**
 * @template T
 * @param {string} key
 * @param {T} initial
 * @param {(raw: string) => T} [parse]
 */
export function usePersistedState(key, initial, parse = JSON.parse) {
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initialRef.current;
      return parse(raw);
    } catch {
      return initialRef.current;
    }
  }, [key, parse]);

  const [value, setValue] = useState(read);

  // Re-read when storage key changes (e.g. userId), not when `initial` reference changes.
  useEffect(() => {
    setValue(read());
  }, [key, read]);

  const setPersisted = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* quota */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setPersisted];
}
