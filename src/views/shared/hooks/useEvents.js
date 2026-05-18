import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabaseClient";

/**
 * Celebraciones (cumpleaños / eventos).
 * Requiere migración: supabase/migrations/001_events_module.sql
 */
export function useEvents(userId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setEvents([]);
    } else {
      setEvents(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = useCallback(
    async (payload) => {
      const row = {
        title: payload.title,
        event_date: payload.event_date,
        kind: payload.kind ?? "birthday",
        notes: payload.notes ?? null,
        user_id: userId,
      };
      const { data, error: insertError } = await supabase
        .from("events")
        .insert([row])
        .select()
        .single();
      if (insertError) return { error: insertError.message };
      setEvents((prev) =>
        [...prev, data].sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
        ),
      );
      return { data };
    },
    [userId],
  );

  const updateEvent = useCallback(
    async (id, patch) => {
      setEvents((prev) =>
        prev
          .map((e) => (e.id === id ? { ...e, ...patch } : e))
          .sort(
            (a, b) =>
              new Date(a.event_date).getTime() -
              new Date(b.event_date).getTime(),
          ),
      );
      const { error: updateError } = await supabase
        .from("events")
        .update(patch)
        .eq("id", id);
      if (updateError) {
        fetchEvents();
        return { error: updateError.message };
      }
      return {};
    },
    [fetchEvents],
  );

  const deleteEvent = useCallback(
    async (id) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      const { error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", id);
      if (deleteError) {
        fetchEvents();
        return { error: deleteError.message };
      }
      return {};
    },
    [fetchEvents],
  );

  return {
    events,
    loading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
