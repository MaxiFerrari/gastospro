import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Gastos del festejo (solo Celebraciones; no son movimientos de la app).
 * Requiere: supabase/migrations/002_event_expenses.sql
 */
export function useEventExpenses(eventIds) {
  const [expensesByEventId, setExpensesByEventId] = useState({});
  const [loading, setLoading] = useState(false);

  const key = eventIds?.length ? [...eventIds].sort().join(",") : "";

  const fetchExpenses = useCallback(async () => {
    if (!eventIds?.length) {
      setExpensesByEventId({});
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("event_expenses")
      .select("*")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error || !data) {
      setExpensesByEventId({});
      return;
    }
    const map = {};
    for (const row of data) {
      if (!map[row.event_id]) map[row.event_id] = [];
      map[row.event_id].push(row);
    }
    setExpensesByEventId(map);
  }, [key]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (eventId, payload) => {
    const row = {
      event_id: eventId,
      description: payload.description,
      amount: payload.amount,
      notes: payload.notes ?? null,
    };
    const { data, error: insertError } = await supabase
      .from("event_expenses")
      .insert([row])
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    setExpensesByEventId((prev) => ({
      ...prev,
      [eventId]: [data, ...(prev[eventId] ?? [])],
    }));
    return { data };
  }, []);

  const deleteExpense = useCallback(async (eventId, expenseId) => {
    setExpensesByEventId((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).filter((e) => e.id !== expenseId),
    }));
    await supabase.from("event_expenses").delete().eq("id", expenseId);
  }, []);

  return {
    expensesByEventId,
    loading,
    refetch: fetchExpenses,
    addExpense,
    deleteExpense,
  };
}
