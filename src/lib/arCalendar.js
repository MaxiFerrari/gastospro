import calendarData from "../data/arCalendar.json";
import { parseEventDateLocal, daysBetweenLocal, localTodayMidnight } from "./eventCountdown";

/**
 * @typedef {{ date: string; title: string }} ArHoliday
 * @typedef {{ start: string; end: string; title: string }} ArSchoolBreak
 * @typedef {{ title: string; date: Date; days: number; kind: 'holiday' | 'school_break_start' }} PlanningHighlight
 */

/**
 * @param {Date} [today]
 * @param {{ daysAhead?: number }} [options]
 * @returns {Array<ArHoliday & { dateObj: Date; days: number }>}
 */
export function getUpcomingHolidays(today = localTodayMidnight(), options = {}) {
  const { daysAhead = 120 } = options;
  const max = new Date(today);
  max.setDate(max.getDate() + daysAhead);

  return (calendarData.holidays ?? [])
    .map((h) => {
      const dateObj = parseEventDateLocal(h.date);
      return { ...h, dateObj, days: daysBetweenLocal(today, dateObj) };
    })
    .filter((h) => h.dateObj >= today && h.dateObj <= max)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}

/**
 * @param {Date} [today]
 * @param {{ daysAhead?: number }} [options]
 * @returns {Array<ArSchoolBreak & { startDate: Date; endDate: Date; daysUntilStart: number }>}
 */
export function getUpcomingSchoolBreaks(today = localTodayMidnight(), options = {}) {
  const { daysAhead = 180 } = options;
  const max = new Date(today);
  max.setDate(max.getDate() + daysAhead);

  return (calendarData.schoolBreaks ?? [])
    .map((b) => {
      const startDate = parseEventDateLocal(b.start);
      const endDate = parseEventDateLocal(b.end);
      return {
        ...b,
        startDate,
        endDate,
        daysUntilStart: daysBetweenLocal(today, startDate),
      };
    })
    .filter((b) => b.startDate >= today && b.startDate <= max)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Próximo feriado o inicio de vacaciones escolares (para Inicio / ¿Qué hago ahora?).
 * @param {Date} [today]
 * @returns {PlanningHighlight | null}
 */
export function getNextPlanningHighlight(today = localTodayMidnight()) {
  const holiday = getUpcomingHolidays(today, { daysAhead: 90 })[0];
  const school = getUpcomingSchoolBreaks(today, { daysAhead: 120 })[0];

  /** @type {PlanningHighlight | null} */
  let best = null;

  if (holiday) {
    best = {
      title: holiday.title,
      date: holiday.dateObj,
      days: holiday.days,
      kind: "holiday",
    };
  }

  if (school && (!best || school.daysUntilStart < best.days)) {
    best = {
      title: school.title,
      date: school.startDate,
      days: school.daysUntilStart,
      kind: "school_break_start",
    };
  }

  return best;
}

/**
 * @param {number} days
 */
export function formatPlanningDays(days) {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days < 7) return `En ${days} días`;
  if (days < 14) return "En 1 semana";
  const w = Math.round(days / 7);
  return w <= 1 ? "En ~1 semana" : `En ~${w} semanas`;
}
