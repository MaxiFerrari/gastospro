import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { migrateHousekeeperLocalToCloud } from "../lib/migrateHousekeeperToCloud";

const DEFAULT_SETTINGS = { hourlyRate: 0, mobilityRate: 0 };

/**
 * @param {Record<string, unknown>} row
 */
function mapSettings(row) {
  return {
    hourlyRate: Number(row.hourly_rate) || 0,
    mobilityRate: Number(row.mobility_rate) || 0,
  };
}

/**
 * @param {Record<string, unknown>} row
 */
function mapEntry(row) {
  return {
    id: String(row.id),
    date: String(row.work_date),
    hours: Number(row.hours) || 0,
    minutes: Number(row.minutes) || 0,
  };
}

export function useHousekeeper(userId) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    await migrateHousekeeperLocalToCloud(userId);

    const [settingsRes, entriesRes] = await Promise.all([
      supabase
        .from("housekeeper_settings")
        .select("hourly_rate, mobility_rate")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("housekeeper_entries")
        .select("id, work_date, hours, minutes")
        .eq("user_id", userId)
        .order("work_date", { ascending: false }),
    ]);

    if (settingsRes.error) {
      setError(settingsRes.error.message);
      setSettings(DEFAULT_SETTINGS);
    } else {
      setSettings(
        settingsRes.data ? mapSettings(settingsRes.data) : DEFAULT_SETTINGS,
      );
    }

    if (entriesRes.error) {
      setError(entriesRes.error.message);
      setEntries([]);
    } else {
      setEntries((entriesRes.data ?? []).map(mapEntry));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveSettings = useCallback(
    async (next) => {
      if (!userId) return;
      setSettings(next);
      const { error: upsertError } = await supabase
        .from("housekeeper_settings")
        .upsert(
          {
            user_id: userId,
            hourly_rate: next.hourlyRate,
            mobility_rate: next.mobilityRate,
          },
          { onConflict: "user_id" },
        );
      if (upsertError) {
        setError(upsertError.message);
        fetchAll();
      }
    },
    [userId, fetchAll],
  );

  const addEntry = useCallback(
    async (entry) => {
      if (!userId) return;
      const hours = entry.hours || 0;
      const minutes = entry.minutes || 0;
      const { data, error: insertError } = await supabase
        .from("housekeeper_entries")
        .insert([
          {
            user_id: userId,
            work_date: entry.date,
            hours,
            minutes,
          },
        ])
        .select("id, work_date, hours, minutes")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      const item = mapEntry(data);
      setEntries((prev) =>
        [...prev, item].sort((a, b) => b.date.localeCompare(a.date)),
      );
    },
    [userId],
  );

  const removeEntry = useCallback(
    async (id) => {
      if (!userId) return;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      const { error: deleteError } = await supabase
        .from("housekeeper_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (deleteError) {
        setError(deleteError.message);
        fetchAll();
      }
    },
    [userId, fetchAll],
  );

  const updateEntry = useCallback(
    async (id, patch) => {
      if (!userId) return;
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;

      const updated = {
        hours: patch.hours ?? entry.hours,
        minutes: patch.minutes ?? entry.minutes,
      };

      setEntries((prev) =>
        prev
          .map((e) => (e.id === id ? { ...e, ...updated } : e))
          .sort((a, b) => b.date.localeCompare(a.date)),
      );

      const { error: updateError } = await supabase
        .from("housekeeper_entries")
        .update({
          hours: updated.hours,
          minutes: updated.minutes,
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        fetchAll();
      }
    },
    [userId, entries, fetchAll],
  );

  return {
    settings,
    saveSettings,
    entries,
    addEntry,
    removeEntry,
    updateEntry,
    loading,
    error,
    refetch: fetchAll,
  };
}
