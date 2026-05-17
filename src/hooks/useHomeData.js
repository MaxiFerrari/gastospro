import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";

function newId() {
  return `home-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_TASKS = /** @type {const} */ ([]);
const DEFAULT_MEMBERS = /** @type {const} */ (["Yo", "Pareja"]);

/**
 * @param {string | null} userId
 */
export function useHomeData(userId) {
  const base = userId ? `gastospro:home:${userId}` : "gastospro:home:anon";
  const [tasks, setTasks] = usePersistedState(`${base}:tasks`, DEFAULT_TASKS);
  const [members, setMembers] = usePersistedState(
    `${base}:members`,
    DEFAULT_MEMBERS,
  );

  const addTask = useCallback((title, assignee) => {
    const row = {
      id: newId(),
      title: title.trim(),
      assignee: assignee || "Yo",
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [row, ...prev]);
    return row;
  }, [setTasks]);

  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, [setTasks]);

  const deleteTask = useCallback(
    (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
    [setTasks],
  );

  const addMember = useCallback(
    (name) => {
      const n = name.trim();
      if (!n) return;
      setMembers((prev) => (prev.includes(n) ? prev : [...prev, n]));
    },
    [setMembers],
  );

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return {
    tasks,
    pendingTasks,
    doneTasks,
    members,
    addTask,
    toggleTask,
    deleteTask,
    addMember,
  };
}
