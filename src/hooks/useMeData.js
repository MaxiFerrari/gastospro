import { useCallback, useMemo } from "react";
import { usePersistedState } from "./usePersistedState";

function newId() {
  return `me-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {string | null} userId
 */
export function useMeData(userId) {
  const base = userId ? `gastospro:me:${userId}` : "gastospro:me:anon";
  const [habits, setHabits] = usePersistedState(`${base}:habits`, []);
  const [checkIns, setCheckIns] = usePersistedState(`${base}:checkins`, {});
  const [focusMinutes, setFocusMinutes] = usePersistedState(`${base}:focus`, 0);

  const today = todayKey();
  const todayCheckIn = checkIns[today] ?? null;

  const addHabit = useCallback((name) => {
    const row = {
      id: newId(),
      name: name.trim(),
      streak: 0,
      lastDone: null,
    };
    setHabits((prev) => [...prev, row]);
    return row;
  }, [setHabits]);

  const completeHabitToday = useCallback((id) => {
    const d = todayKey();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const wasYesterday =
          h.lastDone &&
          (() => {
            const last = new Date(h.lastDone);
            const y = new Date();
            y.setDate(y.getDate() - 1);
            return last.toISOString().slice(0, 10) === y.toISOString().slice(0, 10);
          })();
        const sameDay = h.lastDone === d;
        if (sameDay) return h;
        return {
          ...h,
          lastDone: d,
          streak: wasYesterday || h.streak === 0 ? h.streak + 1 : 1,
        };
      }),
    );
  }, [setHabits]);

  const deleteHabit = useCallback(
    (id) => setHabits((prev) => prev.filter((h) => h.id !== id)),
    [setHabits],
  );

  const saveCheckIn = useCallback(
    (patch) => {
      setCheckIns((prev) => ({
        ...prev,
        [today]: { ...(prev[today] ?? {}), ...patch, date: today },
      }));
    },
    [setCheckIns, today],
  );

  const habitsDoneToday = useMemo(
    () => habits.filter((h) => h.lastDone === today).length,
    [habits, today],
  );

  return {
    habits,
    todayCheckIn,
    focusMinutes,
    setFocusMinutes,
    habitsDoneToday,
    addHabit,
    completeHabitToday,
    deleteHabit,
    saveCheckIn,
  };
}
