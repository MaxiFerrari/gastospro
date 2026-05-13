import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useFixedItems(userId) {
  const [fixedItems, setFixedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFixedItems = useCallback(async () => {
    if (!userId) {
      setFixedItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("fixed_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setFixedItems(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFixedItems();
  }, [fetchFixedItems]);

  const addFixedItem = useCallback(
    async (payload) => {
      const { data, error } = await supabase
        .from("fixed_items")
        .insert([{ ...payload, user_id: userId }])
        .select()
        .single();
      if (error) return { error: error.message };
      setFixedItems((prev) => [...prev, data]);
      return { data };
    },
    [userId],
  );

  const deleteFixedItem = useCallback(async (id) => {
    setFixedItems((prev) => prev.filter((fi) => fi.id !== id));
    await supabase.from("fixed_items").delete().eq("id", id);
  }, []);

  return { fixedItems, loading, addFixedItem, deleteFixedItem };
}
