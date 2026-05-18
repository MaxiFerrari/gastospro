import { supabase } from "./supabaseClient";
import { getAuthRedirectUrl } from "./authRedirect";
import { fetchAbortSignal } from "./apiErrors";

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

const OPT_IN_KEY = "gastospro:gcal-optin";
const CACHE_PREFIX = "gastospro:gcal-cache:";
const CACHE_MS = 10 * 60 * 1000;

/**
 * @param {string} userId
 */
export function isGoogleCalendarOptIn(userId) {
  if (!userId) return false;
  try {
    return localStorage.getItem(`${OPT_IN_KEY}:${userId}`) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string} userId
 * @param {boolean} on
 */
export function setGoogleCalendarOptIn(userId, on) {
  if (!userId) return;
  try {
    if (on) localStorage.setItem(`${OPT_IN_KEY}:${userId}`, "1");
    else localStorage.removeItem(`${OPT_IN_KEY}:${userId}`);
  } catch {
    /* ignore */
  }
}

/**
 * Token de acceso de Google guardado en la sesión de Supabase OAuth.
 */
export async function getGoogleProviderToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
}

/**
 * Pide permiso de lectura del calendario (re-login / consent con scope extra).
 */
export async function requestGoogleCalendarAccess() {
  const redirectTo = getAuthRedirectUrl();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      ...(redirectTo ? { redirectTo } : {}),
      scopes: `openid email profile ${GOOGLE_CALENDAR_SCOPE}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

/**
 * @param {import('@supabase/supabase-js').Session | null} session
 */
export function sessionHasGoogleProvider(session) {
  const provider =
    session?.user?.app_metadata?.provider ??
    session?.user?.identities?.[0]?.provider;
  return provider === "google" || !!session?.provider_token;
}

/**
 * @param {Record<string, unknown>} item Google Calendar API event
 * @returns {import('./googleCalendarTypes').GoogleCalendarEvent | null}
 */
export function normalizeGoogleCalendarItem(item) {
  if (item.status === "cancelled") return null;
  const startRaw = item.start;
  const endRaw = item.end;
  if (!startRaw || typeof startRaw !== "object") return null;

  /** @type {Date} */
  let startDate;
  /** @type {boolean} */
  let allDay = false;

  if ("date" in startRaw && startRaw.date) {
    const [y, m, d] = String(startRaw.date).split("-").map(Number);
    startDate = new Date(y, m - 1, d);
    allDay = true;
  } else if ("dateTime" in startRaw && startRaw.dateTime) {
    startDate = new Date(String(startRaw.dateTime));
  } else {
    return null;
  }

  let endDate = null;
  if (endRaw && typeof endRaw === "object") {
    if ("date" in endRaw && endRaw.date) {
      const [y, m, d] = String(endRaw.date).split("-").map(Number);
      endDate = new Date(y, m - 1, d);
    } else if ("dateTime" in endRaw && endRaw.dateTime) {
      endDate = new Date(String(endRaw.dateTime));
    }
  }

  const title =
    typeof item.summary === "string" && item.summary.trim()
      ? item.summary.trim()
      : "(Sin título)";

  return {
    id: String(item.id ?? `${title}-${startDate.toISOString()}`),
    title,
    start: startDate,
    end: endDate,
    allDay,
    htmlLink: typeof item.htmlLink === "string" ? item.htmlLink : null,
    location:
      typeof item.location === "string" && item.location.trim()
        ? item.location.trim()
        : null,
    source: "google",
  };
}

/**
 * @param {string} accessToken
 * @param {{ maxResults?: number; daysAhead?: number }} [options]
 */
export async function fetchUpcomingGoogleCalendarEvents(
  accessToken,
  options = {},
) {
  const { maxResults = 12, daysAhead = 90 } = options;
  const timeMin = new Date().toISOString();
  const timeMax = new Date(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000,
  ).toISOString();

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", String(maxResults));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: fetchAbortSignal(20000),
  });

  if (res.status === 401 || res.status === 403) {
    const err = new Error("CALENDAR_AUTH");
    err.code = "CALENDAR_AUTH";
    throw err;
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Google Calendar respondió ${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .map((item) => normalizeGoogleCalendarItem(item))
    .filter(Boolean);
}

/**
 * @param {string} userId
 */
/**
 * @param {unknown[]} raw
 */
function reviveCachedEvents(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => {
    const row = /** @type {Record<string, unknown>} */ (e);
    return {
      ...row,
      start: new Date(String(row.start)),
      end: row.end ? new Date(String(row.end)) : null,
    };
  });
}

function readCache(userId) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_MS) return null;
    return reviveCachedEvents(parsed.events);
  } catch {
    return null;
  }
}

/**
 * @param {string} userId
 * @param {unknown[]} events
 */
function writeCache(userId, events) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${userId}`,
      JSON.stringify({ at: Date.now(), events }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} userId
 * @param {{ maxResults?: number; daysAhead?: number; skipCache?: boolean }} [options]
 */
export async function loadGoogleCalendarEvents(userId, options = {}) {
  const cached = options.skipCache ? null : readCache(userId);
  if (cached) return cached;

  const token = await getGoogleProviderToken();
  if (!token) {
    const err = new Error("CALENDAR_AUTH");
    err.code = "CALENDAR_AUTH";
    throw err;
  }

  const events = await fetchUpcomingGoogleCalendarEvents(token, options);
  writeCache(userId, events);
  return events;
}

/**
 * @param {Date} date
 * @param {boolean} allDay
 */
export function formatGoogleEventWhen(date, allDay) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);

  const timeStr = allDay
    ? "Todo el día"
    : date.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });

  if (diff === 0) return `Hoy · ${timeStr}`;
  if (diff === 1) return `Mañana · ${timeStr}`;
  if (diff > 1 && diff < 7) {
    const wd = date.toLocaleDateString("es-AR", { weekday: "short" });
    return `${wd} · ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${dateStr} · ${timeStr}`;
}
