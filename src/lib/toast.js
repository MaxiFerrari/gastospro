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

/** Internal: subscribe to toast events. Returns unsubscribe fn. */
export function _subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
