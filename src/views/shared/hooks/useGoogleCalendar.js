import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@hooks/useAuth";
import {
  isGoogleCalendarOptIn,
  setGoogleCalendarOptIn,
  loadGoogleCalendarEvents,
  requestGoogleCalendarAccess,
  sessionHasGoogleProvider,
} from "@lib/googleCalendar";
import { toast } from "@lib/toast";

/**
 * @param {string} userId
 * @param {{ maxResults?: number; enabled?: boolean }} [options]
 */
export function useGoogleCalendar(userId, options = {}) {
  const { maxResults = 12, enabled = true } = options;
  const { session } = useAuth();
  const [optIn, setOptIn] = useState(() => isGoogleCalendarOptIn(userId));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [needsAuth, setNeedsAuth] = useState(false);
  const notified = useRef(false);

  const canUseGoogle = sessionHasGoogleProvider(session);

  const refresh = useCallback(
    async ({ notify = false, skipCache = false } = {}) => {
      if (!userId || !optIn || !enabled) return;
      setLoading(true);
      setError(null);
      setNeedsAuth(false);
      try {
        const list = await loadGoogleCalendarEvents(userId, {
          maxResults,
          skipCache,
        });
        setEvents(list);
        notified.current = false;
      } catch (e) {
        const code = /** @type {{ code?: string }} */ (e).code;
        if (code === "CALENDAR_AUTH" || e.message === "CALENDAR_AUTH") {
          setNeedsAuth(true);
          setEvents([]);
          setError(
            "Falta permiso de Google Calendar. Volvé a conectar con Google.",
          );
        } else {
          const msg = e.message ?? "No se pudo cargar el calendario";
          setError(msg);
          if (notify && !notified.current) {
            toast(msg, "error");
            notified.current = true;
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, optIn, enabled, maxResults],
  );

  useEffect(() => {
    setOptIn(isGoogleCalendarOptIn(userId));
  }, [userId]);

  useEffect(() => {
    if (optIn && enabled && userId) refresh();
    else if (!optIn) {
      setEvents([]);
      setError(null);
      setNeedsAuth(false);
    }
  }, [optIn, enabled, userId, refresh]);

  async function connect() {
    if (!userId) return;
    setGoogleCalendarOptIn(userId, true);
    setOptIn(true);
    const { error: oauthError } = await requestGoogleCalendarAccess();
    if (oauthError) {
      toast(oauthError.message, "error");
    }
  }

  function disconnect() {
    if (!userId) return;
    setGoogleCalendarOptIn(userId, false);
    setOptIn(false);
    setEvents([]);
    setError(null);
    setNeedsAuth(false);
  }

  return {
    events,
    loading,
    error,
    needsAuth,
    optIn,
    canUseGoogle,
    connect,
    disconnect,
    refresh,
  };
}
