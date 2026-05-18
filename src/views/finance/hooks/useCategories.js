import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabaseClient";

/**
 * Manages user-defined custom categories.
 * Requires this SQL migration on Supabase:
 *
 *   CREATE TABLE IF NOT EXISTS custom_categories (
 *     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     created_at timestamptz DEFAULT now(),
 *     user_id uuid REFERENCES auth.users NOT NULL,
 *     name text NOT NULL,
 *     type text NOT NULL CHECK (type IN ('income', 'expense'))
 *   );
 *   ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users manage own categories" ON custom_categories
 *     FOR ALL USING (auth.uid() = user_id);
 */
export function useCategories(userId) {
  const [customCategories, setCustomCategories] = useState([]);

  const fetchCategories = useCallback(async () => {
    if (!userId) {
      setCustomCategories([]);
      return;
    }
    const { data } = await supabase
      .from("custom_categories")
      .select("*")
      .order("name");
    if (data) setCustomCategories(data);
  }, [userId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(
    async (name, type) => {
      const trimmed = name.trim();
      if (!trimmed) return { error: "Nombre requerido" };
      const { data, error } = await supabase
        .from("custom_categories")
        .insert([{ name: trimmed, type, user_id: userId }])
        .select()
        .single();
      if (!error && data) {
        setCustomCategories((prev) =>
          [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      return { data, error: error?.message };
    },
    [userId],
  );

  const deleteCategory = useCallback(async (id) => {
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("custom_categories").delete().eq("id", id);
  }, []);

  return { customCategories, addCategory, deleteCategory };
}
