import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all transactions ordered by creation date descending
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTransactions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Optimistic add: update UI immediately, rollback on failure
  const addTransaction = useCallback(async (payload) => {
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticItem = {
      id: optimisticId,
      created_at: new Date().toISOString(),
      ...payload,
    };

    // Optimistic update — show immediately
    setTransactions((prev) => [optimisticItem, ...prev]);

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      // Rollback optimistic update
      setTransactions((prev) => prev.filter((t) => t.id !== optimisticId));
      return { error: insertError.message };
    }

    // Replace optimistic item with real server record
    setTransactions((prev) =>
      prev.map((t) => (t.id === optimisticId ? data : t)),
    );
    return { data };
  }, []);

  // Delete a transaction by id
  const deleteTransaction = useCallback(
    async (id) => {
      // Optimistic removal
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (deleteError) {
        // Rollback: re-fetch to restore state
        fetchTransactions();
        return { error: deleteError.message };
      }
      return {};
    },
    [fetchTransactions],
  );

  return { transactions, loading, error, addTransaction, deleteTransaction };
}
