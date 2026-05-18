import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabaseClient";

export function useSubscriptions(userId) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    if (!userId) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) setSubscriptions(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = useCallback(
    async (payload) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert([{ ...payload, user_id: userId }])
        .select()
        .single();
      if (!error && data) setSubscriptions((prev) => [...prev, data]);
      return { data, error: error?.message };
    },
    [userId],
  );

  const updateSubscription = useCallback(
    async (id, patch) => {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
      const { error } = await supabase
        .from("subscriptions")
        .update(patch)
        .eq("id", id);
      if (error) {
        // rollback
        fetchSubscriptions();
        return { error: error.message };
      }
      return {};
    },
    [fetchSubscriptions],
  );

  const deleteSubscription = useCallback(async (id) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("subscriptions").delete().eq("id", id);
  }, []);

  const toggleActive = useCallback(
    async (id) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return;
      return updateSubscription(id, { active: !sub.active });
    },
    [subscriptions, updateSubscription],
  );

  return {
    subscriptions,
    loading,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleActive,
  };
}
