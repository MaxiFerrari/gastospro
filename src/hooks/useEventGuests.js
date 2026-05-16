import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Invitados por evento(s). `eventIds` vacío no hace fetch.
 */
export function useEventGuests(eventIds) {
  const [guestsByEventId, setGuestsByEventId] = useState({});
  const [loading, setLoading] = useState(false);

  const key = eventIds?.length ? [...eventIds].sort().join(",") : "";

  const fetchGuests = useCallback(async () => {
    if (!eventIds?.length) {
      setGuestsByEventId({});
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .in("event_id", eventIds)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error || !data) {
      setGuestsByEventId({});
      return;
    }
    const map = {};
    for (const g of data) {
      if (!map[g.event_id]) map[g.event_id] = [];
      map[g.event_id].push(g);
    }
    setGuestsByEventId(map);
  }, [key]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const addGuest = useCallback(async (eventId, payload) => {
    const row = {
      event_id: eventId,
      name: payload.name,
      rsvp: payload.rsvp ?? "pending",
      party_size: payload.party_size ?? 1,
    };
    const { data, error: insertError } = await supabase
      .from("event_guests")
      .insert([row])
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    setGuestsByEventId((prev) => ({
      ...prev,
      [eventId]: [...(prev[eventId] ?? []), data],
    }));
    return { data };
  }, []);

  const updateGuest = useCallback(
    async (eventId, guestId, patch) => {
      setGuestsByEventId((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] ?? []).map((g) =>
          g.id === guestId ? { ...g, ...patch } : g,
        ),
      }));
      const { error: updateError } = await supabase
        .from("event_guests")
        .update(patch)
        .eq("id", guestId);
      if (updateError) {
        fetchGuests();
        return { error: updateError.message };
      }
      return {};
    },
    [fetchGuests],
  );

  const deleteGuest = useCallback(async (eventId, guestId) => {
    setGuestsByEventId((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).filter((g) => g.id !== guestId),
    }));
    await supabase.from("event_guests").delete().eq("id", guestId);
  }, []);

  return {
    guestsByEventId,
    loading,
    refetch: fetchGuests,
    addGuest,
    updateGuest,
    deleteGuest,
  };
}
