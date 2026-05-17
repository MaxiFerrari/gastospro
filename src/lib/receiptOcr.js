/**
 * Parsea texto de ticket (OCR, Live Text de iOS, o pegado manual).
 * Heurística simple — sin dependencia de OCR en el navegador por ahora.
 *
 * @param {string} rawText
 * @returns {{ items: { name: string; quantity?: number; price?: number }[]; lines: string[] }}
 */
export function parseReceiptText(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  /** @type {{ name: string; quantity?: number; price?: number }[]} */
  const items = [];

  const priceAtEnd = /^(.+?)\s+[\$]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*$/;
  const qtyPrefix = /^(\d+)\s*x?\s+(.+)$/i;
  const skip = /^(total|subtotal|iva|tarjeta|efectivo|cuit|fecha|ticket|gracias)/i;

  for (const line of lines) {
    if (line.length < 2 || skip.test(line)) continue;
    if (/^\d{2}\/\d{2}\/\d{2,4}/.test(line)) continue;

    let name = line;
    let quantity;
    let price;

    const pm = line.match(priceAtEnd);
    if (pm) {
      name = pm[1].trim();
      price = parseArAmount(pm[2]);
    }

    const qm = name.match(qtyPrefix);
    if (qm) {
      quantity = parseInt(qm[1], 10);
      name = qm[2].trim();
    }

    if (name.length < 2) continue;
    if (/^[\d\s.,]+$/.test(name)) continue;
    if (price == null && quantity == null && /^[A-ZÁÉÍÓÚÑ0-9\s\-]+$/.test(line) && line.length > 12) {
      continue;
    }
    if (price == null && !/\d/.test(line)) continue;

    items.push({
      name: capitalizeName(name),
      ...(quantity ? { quantity } : {}),
      ...(price != null ? { price } : {}),
    });
  }

  return { items, lines };
}

function parseArAmount(raw) {
  const n = raw.replace(/\./g, "").replace(",", ".");
  const v = parseFloat(n);
  return Number.isFinite(v) ? v : undefined;
}

function capitalizeName(s) {
  if (s === s.toUpperCase() && s.length > 4) {
    return s
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return s;
}

/**
 * OCR con cámara/archivo — extensible (Tesseract.js u API).
 * @param {File} _file
 */
export async function scanReceiptImage(_file) {
  throw new Error(
    "OCR desde imagen próximamente. Por ahora pegá el texto del ticket o usá Live Text en iPhone.",
  );
}
