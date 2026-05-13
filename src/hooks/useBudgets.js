import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Manages monthly budgets per category.
 * Requires this SQL migration on Supabase:
 *
 *   CREATE TABLE IF NOT EXISTS budgets (
 *     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     created_at timestamptz DEFAULT now(),
 *     user_id uuid REFERENCES auth.users NOT NULL,
 *     category text NOT NULL,
 *     amount numeric NOT NULL,
 *     UNIQUE(user_id, category)
 *   );
 *   ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users manage own budgets" ON budgets
 *     FOR ALL USING (auth.uid() = user_id);
 */
export function useBudgets(userId) {
  const [budgets, setBudgets] = useState([]);

  const fetchBudgets = useCallback(async () => {
    if (!userId) {
      setBudgets([]);
      return;
    }
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId);
    if (data) setBudgets(data);
  }, [userId]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const upsertBudget = useCallback(
    async (category, amount) => {
      const { data, error } = await supabase
        .from("budgets")
        .upsert([{ user_id: userId, category, amount }], {
          onConflict: "user_id,category",
        })
        .select()
        .single();
      if (!error && data) {
        setBudgets((prev) => {
          const exists = prev.find((b) => b.category === category);
          return exists
            ? prev.map((b) => (b.category === category ? data : b))
            : [...prev, data];
        });
      }
      return { data, error: error?.message };
    },
    [userId],
  );

  const deleteBudget = useCallback(
    async (category) => {
      setBudgets((prev) => prev.filter((b) => b.category !== category));
      await supabase
        .from("budgets")
        .delete()
        .eq("user_id", userId)
        .eq("category", category);
    },
    [userId],
  );

  return { budgets, upsertBudget, deleteBudget };
}
