import {
  parseEventDateLocal,
  localTodayMidnight,
  daysBetweenLocal,
  formatCountdown,
} from "./eventCountdown";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/**
 * @param {Array<{ id: string; title: string; event_date: string; kind?: string; notes?: string | null }>} events
 * @param {number} year
 */
export function groupBirthdaysByMonth(events, year) {
  const today = localTodayMidnight();
  const currentYear = today.getFullYear();

  /** @type {Array<{ month: number; label: string; items: Array<{ event: typeof events[0]; date: Date; days: number | null; label: string }> }>} */
  const months = MONTH_NAMES.map((label, month) => ({
    month,
    label,
    items: [],
  }));

  for (const event of events ?? []) {
    if (event.kind && event.kind !== "birthday") continue;
    const base = parseEventDateLocal(event.event_date);
    const date = new Date(year, base.getMonth(), base.getDate());
    const monthIdx = base.getMonth();
    let days = null;
    let countdownLabel = "";
    if (year === currentYear) {
      days = daysBetweenLocal(today, date);
      countdownLabel = formatCountdown(days);
    } else if (year > currentYear) {
      countdownLabel = String(year);
    } else {
      countdownLabel = String(year);
    }

    months[monthIdx].items.push({
      event,
      date,
      days,
      label: countdownLabel,
    });
  }

  for (const m of months) {
    m.items.sort((a, b) => a.date.getDate() - b.date.getDate());
  }

  return months;
}

/**
 * @param {number} year
 */
export function formatBirthdayDay(date) {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export { MONTH_NAMES };
