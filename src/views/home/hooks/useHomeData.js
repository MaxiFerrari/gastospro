import { useState, useEffect, useCallback } from "react";
import { supabase } from "@lib/supabaseClient";
import { migrateLocalDataToCloud } from "@lib/migrateLocalToCloud";

/**
 * @param {string | null} userId
 */
export function useHomeData(userId) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    await migrateLocalDataToCloud(userId);

    const [tasksRes, membersRes] = await Promise.all([
      supabase
        .from("home_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("home_members")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
    ]);

    if (tasksRes.error || membersRes.error) {
      setError(tasksRes.error?.message ?? membersRes.error?.message ?? "Error");
      setTasks([]);
      setMembers(membersRes.data?.length ? membersRes.data.map((m) => m.name) : ["Yo", "Pareja"]);
    } else {
      setTasks(tasksRes.data ?? []);
      const memberRows = membersRes.data ?? [];
      if (memberRows.length === 0) {
        await supabase.from("home_members").insert([
          { user_id: userId, name: "Yo", sort_order: 0 },
          { user_id: userId, name: "Pareja", sort_order: 1 },
        ]);
        setMembers(["Yo", "Pareja"]);
      } else {
        setMembers(memberRows.map((m) => m.name));
      }
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTask = useCallback(
    async (title, assignee) => {
      if (!userId) return null;
      const { data, error: insertError } = await supabase
        .from("home_tasks")
        .insert([
          {
            user_id: userId,
            title: title.trim(),
            assignee: assignee || "Yo",
            done: false,
          },
        ])
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        return null;
      }
      setTasks((prev) => [data, ...prev]);
      return data;
    },
    [userId],
  );

  const toggleTask = useCallback(async (id) => {
    const row = tasks.find((t) => t.id === id);
    if (!row) return;
    const done = !row.done;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    const { error: updateError } = await supabase
      .from("home_tasks")
      .update({ done })
      .eq("id", id);
    if (updateError) await fetchAll();
  }, [tasks, fetchAll]);

  const deleteTask = useCallback(
    async (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await supabase.from("home_tasks").delete().eq("id", id);
    },
    [],
  );

  const addMember = useCallback(
    async (name) => {
      const n = name.trim();
      if (!n || !userId || members.includes(n)) return;
      const { error: insertError } = await supabase.from("home_members").insert([
        { user_id: userId, name: n, sort_order: members.length },
      ]);
      if (!insertError) setMembers((prev) => [...prev, n]);
    },
    [userId, members],
  );

  const removeMember = useCallback(
    async (name) => {
      if (!userId || members.length <= 1) return false;
      const fallback = members.find((m) => m !== name) ?? "Yo";

      const { error: deleteError } = await supabase
        .from("home_members")
        .delete()
        .eq("user_id", userId)
        .eq("name", name);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      const affected = tasks.filter((t) => t.assignee === name);
      if (affected.length) {
        await supabase
          .from("home_tasks")
          .update({ assignee: fallback })
          .eq("user_id", userId)
          .eq("assignee", name);
        setTasks((prev) =>
          prev.map((t) =>
            t.assignee === name ? { ...t, assignee: fallback } : t,
          ),
        );
      }

      setMembers((prev) => prev.filter((m) => m !== name));
      return true;
    },
    [userId, members, tasks],
  );

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return {
    tasks,
    pendingTasks,
    doneTasks,
    members,
    loading,
    error,
    addTask,
    toggleTask,
    deleteTask,
    addMember,
    removeMember,
    refetch: fetchAll,
  };
}
