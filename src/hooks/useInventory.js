import { useCallback, useMemo } from "react";
import { usePersistedState } from "./usePersistedState";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   minQuantity: number;
 *   currentQuantity: number;
 *   unit: string;
 *   context: string;
 * }} InventoryItem
 */

function newId() {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string | null} userId
 */
export function useInventory(userId) {
  const storageKey = userId
    ? `gastospro:inventory:${userId}`
    : "gastospro:inventory:anon";

  const [items, setItems] = usePersistedState(/** @type {InventoryItem[]} */ (storageKey), []);

  const addItem = useCallback((payload) => {
    const row = {
      id: newId(),
      name: payload.name.trim(),
      minQuantity: Number(payload.minQuantity) || 1,
      currentQuantity: Number(payload.currentQuantity) || 0,
      unit: payload.unit || "u",
      context: payload.context || DEFAULT_SHOPPING_CONTEXT,
    };
    setItems((prev) => [...prev, row]);
    return row;
  }, [setItems]);

  const updateItem = useCallback(
    (id, patch) => {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      );
    },
    [setItems],
  );

  const deleteItem = useCallback(
    (id) => setItems((prev) => prev.filter((x) => x.id !== id)),
    [setItems],
  );

  const adjustQuantity = useCallback(
    (id, delta) => {
      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                currentQuantity: Math.max(0, x.currentQuantity + delta),
              }
            : x,
        ),
      );
    },
    [setItems],
  );

  const lowStock = useMemo(
    () => items.filter((x) => x.currentQuantity <= x.minQuantity),
    [items],
  );

  const findByName = useCallback(
    (name) =>
      items.find((x) => x.name.toLowerCase() === name.trim().toLowerCase()),
    [items],
  );

  return {
    items,
    lowStock,
    addItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    findByName,
  };
}
