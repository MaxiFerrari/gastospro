import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { migrateLocalDataToCloud } from "../lib/migrateLocalToCloud";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";

/**
 * @param {string | null} userId
 */
export function useInventory(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    await migrateLocalDataToCloud(userId);
    const { data, error: fetchError } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .order("name");

    if (fetchError) {
      setError(fetchError.message);
      setItems([]);
    } else {
      setItems(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          minQuantity: Number(row.min_quantity),
          currentQuantity: Number(row.current_quantity),
          unit: row.unit,
          context: row.context_id,
        })),
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addItem = useCallback(
    async (payload) => {
      if (!userId) return null;
      const { data, error: insertError } = await supabase
        .from("inventory_items")
        .insert([
          {
            user_id: userId,
            name: payload.name.trim(),
            min_quantity: Number(payload.minQuantity) || 1,
            current_quantity: Number(payload.currentQuantity) || 0,
            unit: payload.unit || "u",
            context_id: payload.context || DEFAULT_SHOPPING_CONTEXT,
          },
        ])
        .select()
        .single();
      if (insertError) return null;
      const mapped = {
        id: data.id,
        name: data.name,
        minQuantity: Number(data.min_quantity),
        currentQuantity: Number(data.current_quantity),
        unit: data.unit,
        context: data.context_id,
      };
      setItems((prev) => [...prev, mapped]);
      return mapped;
    },
    [userId],
  );

  const updateItem = useCallback(async (id, patch) => {
    const dbPatch = {};
    if (patch.name != null) dbPatch.name = patch.name;
    if (patch.minQuantity != null) dbPatch.min_quantity = patch.minQuantity;
    if (patch.currentQuantity != null) dbPatch.current_quantity = patch.currentQuantity;
    if (patch.unit != null) dbPatch.unit = patch.unit;
    if (patch.context != null) dbPatch.context_id = patch.context;

    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
    await supabase.from("inventory_items").update(dbPatch).eq("id", id);
  }, []);

  const deleteItem = useCallback(async (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    await supabase.from("inventory_items").delete().eq("id", id);
  }, []);

  const adjustQuantity = useCallback(async (id, delta) => {
    const row = items.find((x) => x.id === id);
    if (!row) return;
    const currentQuantity = Math.max(0, row.currentQuantity + delta);
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, currentQuantity } : x)),
    );
    await supabase
      .from("inventory_items")
      .update({ current_quantity: currentQuantity })
      .eq("id", id);
  }, [items]);

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
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    findByName,
    refetch: fetchAll,
  };
}
