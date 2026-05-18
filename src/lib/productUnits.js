import { formatCurrency } from "./amount";
import { parseItemPrice } from "./shoppingTotals";

/**
 * @param {string | number | null | undefined} raw
 */
function parseNum(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Infer unit and package amount from Open Food Facts quantity string.
 * @param {string | null | undefined} quantityStr e.g. "1,5 L", "500 ml"
 */
export function inferUnitFromQuantity(quantityStr) {
  if (!quantityStr?.trim()) {
    return { unit: "u", size: null, sizeLabel: null };
  }

  const s = quantityStr.toLowerCase().trim();
  const mult = s.match(
    /(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(ml|l|litre|liter|litro|litros|g|kg)/,
  );
  if (mult) {
    const count = parseInt(mult[1], 10);
    const each = parseNum(mult[2]);
    const u = mult[3];
    if (each && u.startsWith("ml")) {
      const totalMl = count * each;
      if (totalMl >= 1000) {
        return {
          unit: "L",
          size: totalMl / 1000,
          sizeLabel: String(totalMl / 1000),
        };
      }
      return { unit: "ml", size: totalMl, sizeLabel: String(totalMl) };
    }
  }

  const ml = s.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (ml) {
    const amount = parseNum(ml[1]);
    if (amount >= 1000) {
      return { unit: "L", size: amount / 1000, sizeLabel: String(amount / 1000) };
    }
    return { unit: "ml", size: amount, sizeLabel: ml[1].replace(",", ".") };
  }

  const liters = s.match(/(\d+(?:[.,]\d+)?)\s*(?:l|litre|liter|litro|litros)\b/);
  if (liters) {
    return {
      unit: "L",
      size: parseNum(liters[1]),
      sizeLabel: liters[1].replace(",", "."),
    };
  }

  const kg = s.match(/(\d+(?:[.,]\d+)?)\s*kg\b/);
  if (kg) {
    return {
      unit: "kg",
      size: parseNum(kg[1]),
      sizeLabel: kg[1].replace(",", "."),
    };
  }

  const grams = s.match(/(\d+(?:[.,]\d+)?)\s*g(?:ramos?)?\b/);
  if (grams) {
    const amount = parseNum(grams[1]);
    if (amount >= 1000) {
      return {
        unit: "kg",
        size: amount / 1000,
        sizeLabel: String(amount / 1000),
      };
    }
    return { unit: "g", size: amount, sizeLabel: grams[1].replace(",", ".") };
  }

  return { unit: "u", size: null, sizeLabel: quantityStr.trim() };
}

/**
 * @param {{ price?: unknown; unit?: string; size?: string | number | null }} item
 * @returns {{ line: string; basisLabel: string; unitPrice: number } | null}
 */
export function getUnitPriceDisplay(item) {
  const price = parseItemPrice(item.price);
  if (price == null) return null;

  const unit = item.unit || "u";
  const amount = parseNum(item.size);

  if (unit === "L" && amount) {
    const unitPrice = price / amount;
    return {
      line: `${formatCurrency(unitPrice, 0)} / L`,
      basisLabel: "por litro",
      unitPrice,
    };
  }

  if (unit === "ml" && amount) {
    const liters = amount / 1000;
    const unitPrice = price / liters;
    return {
      line: `${formatCurrency(unitPrice, 0)} / L`,
      basisLabel: "por litro",
      unitPrice,
    };
  }

  if (unit === "kg" && amount) {
    const unitPrice = price / amount;
    return {
      line: `${formatCurrency(unitPrice, 0)} / kg`,
      basisLabel: "por kilo",
      unitPrice,
    };
  }

  if (unit === "g" && amount) {
    const kg = amount / 1000;
    const unitPrice = price / kg;
    return {
      line: `${formatCurrency(unitPrice, 0)} / kg`,
      basisLabel: "por kilo",
      unitPrice,
    };
  }

  return {
    line: `${formatCurrency(price, 0)} / u`,
    basisLabel: "por unidad",
    unitPrice: price,
  };
}

/**
 * @param {{ price?: unknown; quantity?: number }} item
 */
export function formatLineTotal(item) {
  const price = parseItemPrice(item.price);
  if (price == null) return null;
  const qty = Number(item.quantity) || 1;
  if (qty <= 1) return formatCurrency(price, 0);
  return formatCurrency(price * qty, 0);
}
