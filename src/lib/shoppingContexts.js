/** @typedef {{ id: string, label: string, emoji: string }} ShoppingContext */

/** @type {ShoppingContext[]} */
export const SHOPPING_CONTEXTS = [
  { id: "super", label: "Super", emoji: "🛒" },
  { id: "farmacia", label: "Farmacia", emoji: "💊" },
  { id: "ferreteria", label: "Ferretería", emoji: "🔧" },
  { id: "kiosco", label: "Kiosco", emoji: "🏪" },
  { id: "otros", label: "Otros", emoji: "📦" },
];

export const DEFAULT_SHOPPING_CONTEXT = "super";

export function getShoppingContext(id) {
  return SHOPPING_CONTEXTS.find((c) => c.id === id) ?? SHOPPING_CONTEXTS[0];
}

export function isValidShoppingContext(id) {
  return SHOPPING_CONTEXTS.some((c) => c.id === id);
}
