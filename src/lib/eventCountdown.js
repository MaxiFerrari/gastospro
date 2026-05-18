/**
 * @param {string} iso YYYY-MM-DD
 */
export function parseEventDateLocal(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** @returns {Date} today at local midnight */
export function localTodayMidnight() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Días antes del próximo cumple (año siguiente) para volver a mostrarlo en Inicio. */
export const BIRTHDAY_HOME_LEAD_DAYS = 60;

/**
 * @param {{ event_date: string; kind?: string }} event
 * @param {Date} today
 * @param {{ forHome?: boolean }} [options]
 * @returns {Date | null}
 */
export function getNextOccurrenceDate(
  event,
  today = localTodayMidnight(),
  options = {},
) {
  const { forHome = false } = options;
  const base = parseEventDateLocal(event.event_date);
  if (event.kind === "birthday") {
    const thisYear = new Date(
      today.getFullYear(),
      base.getMonth(),
      base.getDate(),
    );
    if (thisYear >= today) {
      return thisYear;
    }
    const next = new Date(
      today.getFullYear() + 1,
      base.getMonth(),
      base.getDate(),
    );
    if (forHome && daysBetweenLocal(today, next) > BIRTHDAY_HOME_LEAD_DAYS) {
      return null;
    }
    return next;
  }
  return base >= today ? base : null;
}

/**
 * @param {Date} from
 * @param {Date} to
 */
export function daysBetweenLocal(from, to) {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * @param {number} days
 */
export function formatCountdown(days) {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days < 7) return `En ${days} días`;
  if (days < 14) return "En 1 semana";
  if (days < 60) {
    const w = Math.round(days / 7);
    return `En ${w} semanas`;
  }
  if (days < 365) {
    const mo = Math.round(days / 30);
    return mo <= 1 ? "En ~1 mes" : `En ~${mo} meses`;
  }
  return `En ${Math.round(days / 365)} años`;
}

/**
 * @param {Date} date
 */
export function formatEventDateLong(date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * @param {Array<{ id: string; title: string; event_date: string; kind?: string }>} events
 * @param {Date} [today]
 * @param {{ forHome?: boolean }} [options]
 */
export function getNextUpcomingEvent(
  events,
  today = localTodayMidnight(),
  options = {},
) {
  /** @type {{ event: typeof events[0]; nextDate: Date; days: number } | null} */
  let best = null;

  for (const event of events ?? []) {
    const nextDate = getNextOccurrenceDate(event, today, options);
    if (!nextDate) continue;
    const days = daysBetweenLocal(today, nextDate);
    if (!best || days < best.days) {
      best = { event, nextDate, days };
    }
  }

  return best;
}
