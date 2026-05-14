import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const RATE_KEY = "gp_usd_rate";
const THEME_KEY = "theme";
const DEFAULT_RATE = 1200;

export function useUserPreferences(userId) {
  const [rate, setRateState] = useState(() => {
    const s = localStorage.getItem(RATE_KEY);
    return s ? Number(s) : DEFAULT_RATE;
  });

  const [dark, setDarkState] = useState(
    () => localStorage.getItem(THEME_KEY) !== "light",
  );

  // Load from Supabase + subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    supabase
      .from("user_preferences")
      .select("usd_rate, theme")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.usd_rate != null) {
          localStorage.setItem(RATE_KEY, String(data.usd_rate));
          setRateState(Number(data.usd_rate));
        }
        if (data.theme != null) {
          localStorage.setItem(THEME_KEY, data.theme);
          setDarkState(data.theme !== "light");
        }
      });

    // Realtime: apply changes coming from another device
    const channel = supabase
      .channel(`user_prefs_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_preferences",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: data }) => {
          if (data.usd_rate != null) {
            localStorage.setItem(RATE_KEY, String(data.usd_rate));
            setRateState(Number(data.usd_rate));
          }
          if (data.theme != null) {
            localStorage.setItem(THEME_KEY, data.theme);
            setDarkState(data.theme !== "light");
          }
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  // Apply dark class to <html> whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function saveToSupabase(updates) {
    if (!userId) return;
    supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .then(() => {});
  }

  function setRate(val) {
    const n = Number(val);
    if (n > 0) {
      localStorage.setItem(RATE_KEY, String(n));
      setRateState(n);
      saveToSupabase({ usd_rate: n });
    }
  }

  function setDark(val) {
    const isDark = typeof val === "function" ? val(dark) : val;
    const theme = isDark ? "dark" : "light";
    localStorage.setItem(THEME_KEY, theme);
    setDarkState(isDark);
    saveToSupabase({ theme });
  }

  return { rate, setRate, dark, setDark };
}
