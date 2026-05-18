import { inferUnitFromQuantity } from "./productUnits";

const API = "https://world.openfoodfacts.org/api/v2/product";

/**
 * @param {string} tag e.g. en:beverages
 */
function categoryFromTag(tag) {
  if (!tag) return "Otros";
  const part = String(tag).split(":").pop() ?? tag;
  const label = part.replace(/-/g, " ");
  const map = {
    beverages: "Bebidas",
    "dairy-products": "Lácteos",
    dairies: "Lácteos",
    milks: "Lácteos",
    snacks: "Snacks",
    "fruits-and-vegetables": "Alimentación",
    meats: "Alimentación",
    breads: "Alimentación",
  };
  return map[part] ?? label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * @param {string} barcode EAN digits
 */
export async function lookupBarcode(barcode) {
  const code = String(barcode).replace(/\D/g, "");
  if (code.length < 8) throw new Error("Código inválido");

  const url = `${API}/${code}.json?fields=product_name,brands,categories_tags,quantity`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo consultar el producto");
  const json = await res.json();
  if (json.status === 0 || !json.product) {
    throw new Error("Producto no encontrado en Open Food Facts");
  }

  const p = json.product;
  const name = (p.product_name || "").trim() || "Producto sin nombre";
  const brand = (p.brands || "").split(",")[0]?.trim() || null;
  const tags = p.categories_tags ?? [];
  const catTag = tags.find((t) => !t.startsWith("en:ab")) ?? tags[0];
  const category = categoryFromTag(catTag);
  const qtyStr = p.quantity?.trim() || null;
  const inferred = inferUnitFromQuantity(qtyStr);

  return {
    barcode: code,
    name,
    brand,
    category,
    quantity: 1,
    unit: inferred.unit,
    size: inferred.sizeLabel ?? inferred.size ?? null,
  };
}
