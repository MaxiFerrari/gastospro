import { useCallback, useMemo } from "react";
import { usePersistedState } from "./usePersistedState";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";

/**
 * Maps shopping item ids → context id (local until DB column exists).
 * @param {string | null} userId
 */
export function useShoppingItemContexts(userId) {
  const storageKey = userId
    ? `gastospro:shoppingContexts:${userId}`
    : "gastospro:shoppingContexts:anon";

  const [map, setMap] = usePersistedState(storageKey, {});

  const getContext = useCallback(
    (itemId) => map[itemId] ?? DEFAULT_SHOPPING_CONTEXT,
    [map],
  );

  const setContext = useCallback(
    (itemId, contextId) => {
      setMap((prev) => ({ ...prev, [itemId]: contextId }));
    },
    [setMap],
  );

  const assignContext = useCallback(
    (itemId, contextId = DEFAULT_SHOPPING_CONTEXT) => {
      setContext(itemId, contextId);
    },
    [setContext],
  );

  const filterByContext = useCallback(
    (items, contextId) => {
      if (!contextId || contextId === "all") return items;
      return items.filter((item) => getContext(item.id) === contextId);
    },
    [getContext],
  );

  const countsByContext = useMemo(() => {
    /** @type {Record<string, number>} */
    const pending = {};
    for (const id of Object.keys(map)) {
      pending[id] = map[id];
    }
    return (items, onlyPending = true) => {
      /** @type {Record<string, number>} */
      const out = {};
      for (const item of items) {
        if (onlyPending && item.completed) continue;
        const ctx = getContext(item.id);
        out[ctx] = (out[ctx] ?? 0) + 1;
      }
      return out;
    };
  }, [getContext, map]);

  return {
    getContext,
    setContext,
    assignContext,
    filterByContext,
    pendingCounts: countsByContext,
  };
}
