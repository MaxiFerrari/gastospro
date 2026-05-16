import { useState, useEffect, useCallback } from "react";

function lsKey(userId, suffix) {
  return `gp_housekeeper_${suffix}_${userId}`;
}

const DEFAULT_SETTINGS = { hourlyRate: 0, mobilityRate: 0 };

export function useHousekeeper(userId) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setEntries([]);
      return;
    }
    try {
      const s = JSON.parse(localStorage.getItem(lsKey(userId, "settings")));
      setSettings(s ?? DEFAULT_SETTINGS);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
    try {
      const e = JSON.parse(localStorage.getItem(lsKey(userId, "entries")));
      setEntries(e ?? []);
    } catch {
      setEntries([]);
    }
  }, [userId]);

  const saveSettings = useCallback(
    (next) => {
      setSettings(next);
      if (userId)
        localStorage.setItem(lsKey(userId, "settings"), JSON.stringify(next));
    },
    [userId],
  );

  const addEntry = useCallback(
    (entry) => {
      const item = {
        ...entry,
        id: `hk-${Date.now()}`,
        hours: entry.hours || 0,
        minutes: entry.minutes || 0,
      };
      setEntries((prev) => {
        const next = [...prev, item].sort((a, b) =>
          b.date.localeCompare(a.date),
        );
        if (userId)
          localStorage.setItem(lsKey(userId, "entries"), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  const removeEntry = useCallback(
    (id) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (userId)
          localStorage.setItem(lsKey(userId, "entries"), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  const updateEntry = useCallback(
    (id, patch) => {
      setEntries((prev) => {
        const entry = prev.find((e) => e.id === id);
        if (!entry) return prev;
        const updated = { ...entry, ...patch };
        const next = prev
          .map((e) => (e.id === id ? updated : e))
          .sort((a, b) => b.date.localeCompare(a.date));
        if (userId)
          localStorage.setItem(lsKey(userId, "entries"), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  return {
    settings,
    saveSettings,
    entries,
    addEntry,
    removeEntry,
    updateEntry,
  };
}
