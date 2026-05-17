import { useEffect } from "react";

function isEditableTarget(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * @param {{
 *   enabled?: boolean;
 *   onNewTransaction?: () => void;
 *   onCloseOverlay?: () => void;
 *   onPrevMonth?: () => void;
 *   onNextMonth?: () => void;
 *   overlayOpen?: boolean;
 *   monthNavEnabled?: boolean;
 * }} options
 */
export function useAppKeyboardShortcuts({
  enabled = true,
  onNewTransaction,
  onCloseOverlay,
  onPrevMonth,
  onNextMonth,
  overlayOpen = false,
  monthNavEnabled = false,
}) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key;

      if (key === "Escape" && overlayOpen) {
        e.preventDefault();
        onCloseOverlay?.();
        return;
      }

      if (monthNavEnabled && key === "ArrowLeft") {
        e.preventDefault();
        onPrevMonth?.();
        return;
      }

      if (monthNavEnabled && key === "ArrowRight") {
        e.preventDefault();
        onNextMonth?.();
        return;
      }

      if ((key === "n" || key === "N") && onNewTransaction) {
        e.preventDefault();
        onNewTransaction();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    overlayOpen,
    monthNavEnabled,
    onNewTransaction,
    onCloseOverlay,
    onPrevMonth,
    onNextMonth,
  ]);
}
