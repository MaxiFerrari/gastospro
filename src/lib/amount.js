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
 * 1500.5 → "1.500,5"   |   1500 → "1.500"   |   1500.55 → "1.500,55"
 * Uses a manual implementation to avoid Intl.NumberFormat locale inconsistencies.
 */
export function formatAmount(num) {
  if (num == null || num === "") return "";
  // toFixed(2) then strip trailing zeros: 1500 → "1500", 1500.5 → "1500.5"
  const trimmed = Number(num)
    .toFixed(2)
    .replace(/\.?0+$/, "");
  const [intPart, decPart] = trimmed.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart ? intFormatted + "," + decPart : intFormatted;
}

/**
 * Format a number as ARS currency (includes $ symbol).
 * Uses Intl.NumberFormat so the $ sign and locale separators are correct.
 * `decimals` controls min & max fraction digits (default 2, pass 0 for whole numbers).
 */
export function formatCurrency(num, decimals = 2) {
  if (num == null) return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(num));
}

/**
 * Strip thousands-separator dots so the user can edit the raw value.
 * "1.500,50" → "1500,50"
 */
export function stripFormat(str) {
  if (!str) return "";
  return str.replace(/\./g, "");
}
