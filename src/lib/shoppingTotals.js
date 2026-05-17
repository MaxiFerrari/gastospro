import { parseAmount } from "./amount";

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parseItemPrice(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  return parseAmount(String(raw));
}

/**
 * @param {{ price?: unknown; quantity?: number }} item
 */
export function itemLineTotal(item) {
  const unit = parseItemPrice(item.price);
  if (unit == null) return 0;
  const qty = Number(item.quantity) || 1;
  return unit * qty;
}

/**
 * @param {Array<{ completed?: boolean; price?: unknown; quantity?: number }>} items
 */
export function computeShoppingTotals(items) {
  let toPay = 0;
  let paid = 0;
  let pricedCount = 0;

  for (const item of items ?? []) {
    const line = itemLineTotal(item);
    if (line <= 0) continue;
    pricedCount += 1;
    if (item.completed) paid += line;
    else toPay += line;
  }

  return { toPay, paid, pricedCount };
}
