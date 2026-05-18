/** Texto de ayuda cuando Google bloquea OAuth (app en modo Testing). */

export const GOOGLE_CALENDAR_SCOPE_URL =
  "https://www.googleapis.com/auth/calendar.readonly";

export const GOOGLE_CALENDAR_SETUP_STEPS = [
  "En Google Cloud Console, abrí el mismo proyecto cuyo Client ID está en Supabase → Authentication → Google.",
  "APIs & Services → Library → activá «Google Calendar API».",
  "APIs & Services → OAuth consent screen → en Scopes agregá «.../auth/calendar.readonly» (ver calendarios).",
  "Si el estado es Testing: en Test users agregá tu Gmail exacto (ej. massif.mf@gmail.com).",
  "Esperá 1–2 minutos y volvé a tocar «Conectar Google Calendar».",
];

/**
 * @param {string} [email]
 */
export function googleCalendarBlockedMessage(email) {
  const who = email ? ` (${email})` : "";
  return `Google bloqueó el acceso${who}: la app OAuth está en modo «Testing» y tu cuenta no está en la lista de testers, o falta el scope de Calendar.`;
}
