import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all transactions ordered by creation date descending
  // RLS on Supabase automatically filters by auth.uid(), but we also
  // reset state when the user changes (e.g. after login/logout)
  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
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
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Optimistic add: update UI immediately, rollback on failure
  const addTransaction = useCallback(
    async (payload) => {
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
        .insert([{ ...payload, user_id: userId }])
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
    },
    [userId],
  );

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

  // Update description and/or amount of an existing transaction
  const updateTransaction = useCallback(
    async (id, patch) => {
      // Optimistic update
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );

      const { error: updateError } = await supabase
        .from("transactions")
        .update(patch)
        .eq("id", id);

      if (updateError) {
        fetchTransactions(); // rollback
        return { error: updateError.message };
      }
      return {};
    },
    [fetchTransactions],
  );

  // Batch-update sort_order after drag-and-drop reorder
  const reorderTransactions = useCallback(async (orderedIds) => {
    setTransactions((prev) => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      return [...prev].sort((a, b) => {
        const ia = indexMap.get(a.id);
        const ib = indexMap.get(b.id);
        if (ia != null && ib != null) return ia - ib;
        if (ia != null) return -1;
        if (ib != null) return 1;
        return 0;
      });
    });
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from("transactions")
          .update({ sort_order: index })
          .eq("id", id),
      ),
    );
  }, []);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    reorderTransactions,
  };
}
