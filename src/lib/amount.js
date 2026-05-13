/**
 * Parse an es-AR formatted amount string to a float.
 * Handles: "1.500", "1.500,50", "1500,50", "1500.50", "1500"
 */
export function parseAmount(raw) {
  if (!raw && raw !== 0) return null;
  const s = String(raw).trim();
  if (!s) return null;

  let normalized;

  if (s.includes(".") && s.includes(",")) {
    // Both: dot = thousands, comma = decimal  →  "1.500,50" → 1500.5
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    // Only comma: decimal separator  →  "1500,50" → 1500.5
    normalized = s.replace(",", ".");
  } else if (s.includes(".")) {
    const parts = s.split(".");
    const afterDot = parts[parts.length - 1];
    // Multiple dots or exactly 3 digits after single dot → thousands separator
    if (parts.length > 2 || afterDot.length === 3) {
      normalized = s.replace(/\./g, "");
    } else {
      // Decimal dot  →  "1500.5" → 1500.5
      normalized = s;
    }
  } else {
    normalized = s;
  }

  const n = parseFloat(normalized);
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * Format a number for display in es-AR locale (dot as thousands, comma as decimal).
 * 1500.5 → "1.500,5"   |   1500 → "1.500"
 */
export function formatAmount(num) {
  if (num == null || num === "") return "";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Strip thousands-separator dots so the user can edit the raw value.
 * "1.500,50" → "1500,50"
 */
export function stripFormat(str) {
  if (!str) return "";
  return str.replace(/\./g, "");
}
