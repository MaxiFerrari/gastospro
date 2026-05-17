let listeners = [];

/**
 * Emit a toast notification.
 * @param {string} message
 * @param {"success"|"error"|"warning"} type
 */
export function toast(message, type = "success") {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) => fn({ id, message, type }));
}

/**
 * Show a confirmation toast with confirm/cancel buttons.
 * @param {string} message
 * @param {() => void} onConfirm  Called when user confirms.
 */
export function toastConfirm(message, onConfirm) {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) => fn({ id, message, type: "confirm", onConfirm }));
}

/**
 * Toast con acción Deshacer (p. ej. tachar en modo supermercado).
 * @param {string} message
 * @param {() => void | Promise<void>} onUndo
 * @param {{ durationMs?: number }} [opts]
 */
export function toastUndo(message, onUndo, opts = {}) {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) =>
    fn({
      id,
      message,
      type: "undo",
      onUndo,
      durationMs: opts.durationMs ?? 5000,
    }),
  );
}

/**
 * Run an async operation and show a success/error toast.
 * `fn` must be a zero-arg function that returns a result with optional `.error`.
 * If errorMsg is omitted, falls back to `result.error`.
 */
export async function withToast(fn, successMsg, errorMsg) {
  const result = await fn();
  if (result?.error) toast(errorMsg ?? result.error, "error");
  else
    toast(typeof successMsg === "function" ? successMsg(result) : successMsg);
  return result;
}

/** Internal: subscribe to toast events. Returns unsubscribe fn. */
export function _subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
