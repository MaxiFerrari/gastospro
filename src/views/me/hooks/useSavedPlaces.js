import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabaseClient";

/**
 * @typedef {object} SavedPlace
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {string | null} address
 * @property {string | null} notes
 * @property {string | null} visited_at
 * @property {string} created_at
 */

/**
 * @typedef {object} PlaceInput
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} [address]
 * @property {string} [notes]
 * @property {string | null} [visited_at]
 */

/**
 * @param {string | null} userId
 */
export function useSavedPlaces(userId) {
  const [places, setPlaces] = useState(/** @type {SavedPlace[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("saved_places")
      .select("*")
      .eq("user_id", userId)
      .order("visited_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setPlaces([]);
    } else {
      setPlaces(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addPlace = useCallback(
    /**
     * @param {PlaceInput} input
     */
    async (input) => {
      if (!userId) return null;
      const name = input.name.trim();
      if (!name) {
        setError("El nombre es obligatorio");
        return null;
      }
      if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
        setError("Ubicación inválida");
        return null;
      }

      const row = {
        user_id: userId,
        name,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        visited_at: input.visited_at || null,
      };

      const { data, error: insertError } = await supabase
        .from("saved_places")
        .insert([row])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }
      setPlaces((prev) => [data, ...prev]);
      return data;
    },
    [userId],
  );

  const updatePlace = useCallback(
    /**
     * @param {string} id
     * @param {Partial<PlaceInput>} patch
     */
    async (id, patch) => {
      const existing = places.find((p) => p.id === id);
      if (!existing) return null;

      const name = patch.name !== undefined ? patch.name.trim() : existing.name;
      if (!name) {
        setError("El nombre es obligatorio");
        return null;
      }

      const row = {
        name,
        latitude: patch.latitude ?? existing.latitude,
        longitude: patch.longitude ?? existing.longitude,
        address:
          patch.address !== undefined
            ? patch.address.trim() || null
            : existing.address,
        notes:
          patch.notes !== undefined ? patch.notes.trim() || null : existing.notes,
        visited_at:
          patch.visited_at !== undefined
            ? patch.visited_at || null
            : existing.visited_at,
      };

      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...row } : p)),
      );

      const { data, error: updateError } = await supabase
        .from("saved_places")
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        await fetchAll();
        return null;
      }
      setPlaces((prev) => prev.map((p) => (p.id === id ? data : p)));
      return data;
    },
    [places, fetchAll],
  );

  const deletePlace = useCallback(
    async (id) => {
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      const { error: deleteError } = await supabase
        .from("saved_places")
        .delete()
        .eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
        await fetchAll();
        return false;
      }
      return true;
    },
    [fetchAll],
  );

  return {
    places,
    loading,
    error,
    fetchAll,
    addPlace,
    updatePlace,
    deletePlace,
  };
}
