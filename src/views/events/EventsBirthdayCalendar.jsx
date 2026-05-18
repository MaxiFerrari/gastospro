import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cake, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEvents } from "@views/shared/hooks/useEvents";
import { groupBirthdaysByMonth, formatBirthdayDay } from "@lib/birthdayCalendar";
import HubSubpageHeader from "@views/shared/HubSubpageHeader";
import { EVENTS_HUB_PATH } from "@lib/routes";

/**
 * @param {{ userId: string }} props
 */
export default function EventsBirthdayCalendar({ userId }) {
  const navigate = useNavigate();
  const { events, loading } = useEvents(userId);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const months = useMemo(
    () => groupBirthdaysByMonth(events, year),
    [events, year],
  );

  const birthdayCount = useMemo(
    () => months.reduce((n, m) => n + m.items.length, 0),
    [months],
  );

  return (
    <div className="mx-auto w-full max-w-6xl lg:max-w-none dark:[color-scheme:dark]">
      <HubSubpageHeader
        title="Calendario de cumpleaños"
        subtitle={`${birthdayCount} cumpleaños en ${year}`}
        backTo={EVENTS_HUB_PATH}
        backLabel="Celebraciones"
      />

      <div className="app-hub-inset flex items-center justify-between gap-3 mb-4 sm:mx-0">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
          aria-label="Año anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tabular-nums">
          {year}
        </span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
          aria-label="Año siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      ) : birthdayCount === 0 ? (
        <div className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 p-10 text-center sm:mx-0">
          <Cake className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No hay cumpleaños en {year}. Creá eventos tipo «Cumpleaños» en Celebraciones.
          </p>
          <button
            type="button"
            onClick={() => navigate(EVENTS_HUB_PATH)}
            className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400 underline"
          >
            Ir a celebraciones
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((m) => (
            <section
              key={m.month}
              className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm sm:mx-0 min-h-[7rem]"
            >
              <h2 className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                {m.label}
              </h2>
              {m.items.length === 0 ? (
                <p className="text-xs text-slate-400">—</p>
              ) : (
                <ul className="space-y-2">
                  {m.items.map(({ event, date, days, label }) => (
                    <li key={`${event.id}-${m.month}`} className="text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {event.title}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {formatBirthdayDay(date)}
                        {days !== null && (
                          <span className="text-violet-600 dark:text-violet-400">
                            {" "}
                            · {label}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
