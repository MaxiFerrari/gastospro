import { useEffect, useRef } from "react";

/**
 * Calls `onOutside` when the user clicks/taps outside `ref`.
 * Only active when `enabled` is true.
 */
export function useOutsideClick(ref, onOutside, enabled = true) {
  const handlerRef = useRef(onOutside);
  handlerRef.current = onOutside;

  useEffect(() => {
    if (!enabled) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [ref, enabled]);
}
