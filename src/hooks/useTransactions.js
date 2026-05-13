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
        status: "pending",
        ...payload,
      };

      // Optimistic update — show immediately
      setTransactions((prev) => [optimisticItem, ...prev]);

      // Strip undefined values so PostgREST doesn't receive unexpected nulls
      const insertPayload = Object.fromEntries(
        Object.entries({
          status: "pending",
          ...payload,
          user_id: userId,
        }).filter(([, v]) => v !== undefined),
      );

      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert([insertPayload])
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

  // Toggle payment status between 'pending' and 'paid'
  const toggleStatus = useCallback(
    async (id) => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      const newStatus = tx.status === "paid" ? "pending" : "paid";
      return updateTransaction(id, { status: newStatus });
    },
    [transactions, updateTransaction],
  );

  // Batch-update sort_order after drag-and-drop reorder
  const reorderTransactions = useCallback(async (orderedIds) => {
    // Optimistically update the sort_order field on each affected transaction
    // so that sortedMonthlyTransactions in App.jsx reflects the new order immediately
    setTransactions((prev) =>
      prev.map((t) => {
        const idx = orderedIds.indexOf(t.id);
        return idx !== -1 ? { ...t, sort_order: idx } : t;
      }),
    );
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from("transactions")
          .update({ sort_order: index })
          .eq("id", id),
      ),
    );
  }, []);

  // Create N installment transactions (one per month) from a base payload
  const addInstallments = useCallback(
    async (basePayload, count, startYear, startMonth) => {
      const installmentId = crypto.randomUUID();
      const amountPerInstallment =
        basePayload.amount != null
          ? Math.round((basePayload.amount / count) * 100) / 100
          : null;

      const records = Array.from({ length: count }, (_, i) => {
        const m = (startMonth + i) % 12;
        const y = startYear + Math.floor((startMonth + i) / 12);
        return Object.fromEntries(
          Object.entries({
            status: "pending",
            ...basePayload,
            amount: amountPerInstallment,
            user_id: userId,
            installment_id: installmentId,
            installment_index: i + 1,
            installment_total: count,
            created_at: new Date(Date.UTC(y, m, 15, 12, 0, 0)).toISOString(),
          }).filter(([, v]) => v !== undefined),
        );
      });

      // Optimistic update
      const optimisticItems = records.map((r, i) => ({
        ...r,
        id: `optimistic-inst-${Date.now()}-${i}`,
      }));
      setTransactions((prev) => [...optimisticItems, ...prev]);

      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert(records)
        .select();

      if (insertError) {
        setTransactions((prev) =>
          prev.filter((t) => !String(t.id).startsWith("optimistic-inst-")),
        );
        return { error: insertError.message };
      }

      // Replace optimistic items with real records
      setTransactions((prev) => {
        const withoutOptimistic = prev.filter(
          (t) => !String(t.id).startsWith("optimistic-inst-"),
        );
        return [...data, ...withoutOptimistic];
      });
      return { data };
    },
    [userId],
  );

  return {
    transactions,
    loading,
    error,
    addTransaction,
    addInstallments,
    deleteTransaction,
    updateTransaction,
    toggleStatus,
    reorderTransactions,
  };
}
