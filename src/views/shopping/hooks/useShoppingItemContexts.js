import { useCallback } from "react";
import { supabase } from "@lib/supabaseClient";
import { DEFAULT_SHOPPING_CONTEXT } from "@lib/shoppingContexts";

/**
 * @param {string | null} userId
 */
export function useShoppingItemContexts(userId) {
  const getContext = useCallback((itemId, items = []) => {
    const item = items.find((i) => i.id === itemId);
    return item?.context_id ?? DEFAULT_SHOPPING_CONTEXT;
  }, []);

  const assignContext = useCallback(
    async (itemId, contextId = DEFAULT_SHOPPING_CONTEXT) => {
      if (!userId || !itemId) return;
      await supabase
        .from("shopping_items")
        .update({ context_id: contextId })
        .eq("id", itemId)
        .eq("user_id", userId);
    },
    [userId],
  );

  const setContext = assignContext;

  const filterByContext = useCallback((items, contextId) => {
    if (!contextId || contextId === "all") return items;
    return items.filter((item) => (item.context_id ?? DEFAULT_SHOPPING_CONTEXT) === contextId);
  }, []);

  const pendingCounts = useCallback((items, onlyPending = true) => {
    /** @type {Record<string, number>} */
    const out = { all: 0 };
    for (const item of items) {
      if (onlyPending && item.completed) continue;
      out.all += 1;
      const ctx = item.context_id ?? DEFAULT_SHOPPING_CONTEXT;
      out[ctx] = (out[ctx] ?? 0) + 1;
    }
    return out;
  }, []);

  return {
    getContext,
    setContext,
    assignContext,
    filterByContext,
    pendingCounts,
  };
}
