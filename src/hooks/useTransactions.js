import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTransactionFetchRange } from "../lib/dates";
import { applyTransactionRealtimeEvent } from "../lib/transactionRealtime";

/**
 * Requires on Supabase:
 *   ALTER TABLE transactions
 *     ADD COLUMN IF NOT EXISTS exclude_from_totals boolean NOT NULL DEFAULT false;
 */
export function useTransactions(userId, { year, month, page } = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRange = useMemo(() => {
    if (year == null || month == null || !page) return null;
    return getTransactionFetchRange(year, month, page);
  }, [year, month, page]);

  const fetchTransactions = useCallback(async () => {
    if (!userId || !page) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let query = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchRange) {
      query = query
        .gte("created_at", fetchRange.from)
        .lte("created_at", fetchRange.to);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTransactions(data ?? []);
    }
    setLoading(false);
  }, [userId, fetchRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchRangeRef = useRef(fetchRange);
  fetchRangeRef.current = fetchRange;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`transactions_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setTransactions((prev) =>
            applyTransactionRealtimeEvent(prev, payload, fetchRangeRef.current),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addTransaction = useCallback(
    async (payload) => {
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticItem = {
        id: optimisticId,
        created_at: new Date().toISOString(),
        status: "pending",
        ...payload,
      };

      setTransactions((prev) => [optimisticItem, ...prev]);

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
        setTransactions((prev) => prev.filter((t) => t.id !== optimisticId));
        return { error: insertError.message };
      }

      setTransactions((prev) =>
        prev.map((t) => (t.id === optimisticId ? data : t)),
      );
      return { data };
    },
    [userId],
  );

  const deleteTransaction = useCallback(
    async (id) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (deleteError) {
        fetchTransactions();
        return { error: deleteError.message };
      }
      return {};
    },
    [fetchTransactions],
  );

  const updateTransaction = useCallback(
    async (id, patch) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );

      const { error: updateError } = await supabase
        .from("transactions")
        .update(patch)
        .eq("id", id);

      if (updateError) {
        fetchTransactions();
        return { error: updateError.message };
      }
      return {};
    },
    [fetchTransactions],
  );

  const toggleStatus = useCallback(
    async (id) => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      const newStatus = tx.status === "paid" ? "pending" : "paid";
      return updateTransaction(id, { status: newStatus });
    },
    [transactions, updateTransaction],
  );

  const reorderTransactions = useCallback(async (orderedIds) => {
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
    refetch: fetchTransactions,
    addTransaction,
    addInstallments,
    deleteTransaction,
    updateTransaction,
    toggleStatus,
    reorderTransactions,
  };
}
