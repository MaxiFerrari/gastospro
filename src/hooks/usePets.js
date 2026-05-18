import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * @param {string} userId
 */
export function usePets(userId) {
  const [pets, setPets] = useState([]);
  const [care, setCare] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setPets([]);
      setCare([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [petsRes, careRes] = await Promise.all([
      supabase.from("pets").select("*").eq("user_id", userId).order("name"),
      supabase
        .from("pet_care")
        .select("*")
        .eq("user_id", userId)
        .order("next_date", { ascending: true, nullsFirst: false }),
    ]);

    if (petsRes.error?.code === "42P01" || careRes.error?.code === "42P01") {
      setError("migration");
      setPets([]);
      setCare([]);
    } else if (petsRes.error || careRes.error) {
      setError(petsRes.error?.message ?? careRes.error?.message ?? "Error");
      setPets([]);
      setCare([]);
    } else {
      setPets(petsRes.data ?? []);
      setCare(careRes.data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addPet = useCallback(
    async ({ name, species = "other", notes = null }) => {
      const { data, error: insertError } = await supabase
        .from("pets")
        .insert([{ user_id: userId, name: name.trim(), species, notes }])
        .select()
        .single();
      if (insertError) return { error: insertError.message };
      setPets((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { data };
    },
    [userId],
  );

  const deletePet = useCallback(async (petId) => {
    setPets((prev) => prev.filter((p) => p.id !== petId));
    setCare((prev) => prev.filter((c) => c.pet_id !== petId));
    const { error: deleteError } = await supabase.from("pets").delete().eq("id", petId);
    if (deleteError) {
      fetchAll();
      return { error: deleteError.message };
    }
    return {};
  }, [fetchAll]);

  const addCare = useCallback(
    async (payload) => {
      const row = {
        user_id: userId,
        pet_id: payload.pet_id,
        care_type: payload.care_type,
        title: payload.title.trim(),
        care_date: payload.care_date || null,
        next_date: payload.next_date || null,
        notes: payload.notes || null,
        amount: payload.amount ?? null,
      };
      const { data, error: insertError } = await supabase
        .from("pet_care")
        .insert([row])
        .select()
        .single();
      if (insertError) return { error: insertError.message };
      setCare((prev) => [...prev, data]);
      return { data };
    },
    [userId],
  );

  const deleteCare = useCallback(
    async (careId) => {
      setCare((prev) => prev.filter((c) => c.id !== careId));
      const { error: deleteError } = await supabase
        .from("pet_care")
        .delete()
        .eq("id", careId);
      if (deleteError) {
        fetchAll();
        return { error: deleteError.message };
      }
      return {};
    },
    [fetchAll],
  );

  const upcomingCare = care.filter((c) => {
    if (!c.next_date) return false;
    const [y, m, d] = c.next_date.split("-").map(Number);
    const next = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 60);
    return next >= today && next <= limit;
  });

  return {
    pets,
    care,
    upcomingCare,
    loading,
    error,
    addPet,
    deletePet,
    addCare,
    deleteCare,
    refresh: fetchAll,
  };
}
