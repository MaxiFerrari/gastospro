const FEEDBACK_KEY = "gastospro:supermarketFeedback";

export function getSupermarketFeedbackEnabled() {
  try {
    const v = localStorage.getItem(FEEDBACK_KEY);
    if (v == null) return true;
    return v === "true";
  } catch {
    return true;
  }
}

export function setSupermarketFeedbackEnabled(enabled) {
  try {
    localStorage.setItem(FEEDBACK_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

/** @param {string} userId */
export function supermarketCheckCountKey(userId) {
  return `gastospro:supermarketChecks:${userId}`;
}

/** @param {string} userId */
export function medalsUnlockedKey(userId) {
  return `gastospro:medals:${userId}`;
}
