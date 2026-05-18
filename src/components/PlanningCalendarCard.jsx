import { useMemo } from "react";
import { CalendarOff, GraduationCap } from "lucide-react";
import {
  getUpcomingHolidays,
  getUpcomingSchoolBreaks,
  formatPlanningDays,
} from "../lib/arCalendar";
import { formatEventDateLong } from "../lib/eventCountdown";

/**
 * Feriados nacionales y vacaciones escolares (referencia AR).
 */
export default function PlanningCalendarCard() {
  const holidays = useMemo(() => getUpcomingHolidays(undefined, { daysAhead: 90 }), []);
  const breaks = useMemo(() => getUpcomingSchoolBreaks(undefined, { daysAhead: 150 }), []);

  const nextHoliday = holidays[0];
  const nextBreak = breaks[0];

  if (!nextHoliday && !nextBreak) return null;

  return (
    <section className="app-hub-inset rounded-2xl border border-sky-100 bg-sky-50/80 p-3 dark:border-sky-900/50 dark:bg-sky-950/30 sm:p-4">
      <h3 className="text-sm font-semibold text-sky-900 dark:text-sky-100 mb-2">
        Calendario Argentina
      </h3>
      <ul className="space-y-2">
        {nextHoliday && (
          <li className="flex gap-2 text-xs text-sky-900 dark:text-sky-100">
            <CalendarOff className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>
              <span className="font-semibold">
                {formatPlanningDays(nextHoliday.days)}: {nextHoliday.title}
              </span>
              <span className="block text-sky-700/90 dark:text-sky-300/90">
                {formatEventDateLong(nextHoliday.dateObj)} · Feriado nacional
              </span>
            </span>
          </li>
        )}
        {nextBreak && (
          <li className="flex gap-2 text-xs text-sky-900 dark:text-sky-100">
            <GraduationCap className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>
              <span className="font-semibold">
                {formatPlanningDays(nextBreak.daysUntilStart)}: {nextBreak.title}
              </span>
              <span className="block text-sky-700/90 dark:text-sky-300/90">
                Del {formatEventDateLong(nextBreak.startDate)} al{" "}
                {formatEventDateLong(nextBreak.endDate)}
              </span>
            </span>
          </li>
        )}
      </ul>
      {holidays.length > 1 && (
        <p className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-2">
          +{holidays.length - 1} feriado{holidays.length > 2 ? "s" : ""} en los próximos meses
        </p>
      )}
    </section>
  );
}
