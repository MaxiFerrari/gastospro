import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cake,
  Home,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { useHomeData } from "../hooks/useHomeData";
import { useInventory } from "../hooks/useInventory";
import { useShoppingList } from "../hooks/useShoppingList";
import { buildPath } from "../lib/routes";
import {
  getNextUpcomingEvent,
  formatCountdown,
  formatEventDateLong,
} from "../lib/eventCountdown";
import WhatToDoNowCard from "./WhatToDoNowCard";
import WeatherCard from "./WeatherCard";
import DolarRatesCard from "./DolarRatesCard";
import MedalsPanel from "./MedalsPanel";

/**
 * @param {{ userId: string }} props
 */
export default function HomeCommandCenter({ userId }) {
  const navigate = useNavigate();
  const { events, loading: eventsLoading } = useEvents(userId);
  const { pendingTasks, doneTasks, loading: homeLoading } = useHomeData(userId);
  const { lowStock, loading: invLoading } = useInventory(userId);
  const { items: shoppingItems, loading: shopLoading } = useShoppingList(userId);

  const nextEvent = useMemo(
    () => getNextUpcomingEvent(events, undefined, { forHome: true }),
    [events],
  );
  const pendingShoppingCount = useMemo(
    () => shoppingItems.filter((i) => !i.completed).length,
    [shoppingItems],
  );

  const loading = eventsLoading || homeLoading || invLoading || shopLoading;
  const topTasks = pendingTasks.slice(0, 3);

  function goEvents() {
    const n = new Date();
    navigate(
      buildPath({
        mode: "events",
        year: n.getFullYear(),
        month: n.getMonth(),
      }),
    );
  }

  function goHome() {
    const n = new Date();
    navigate(
      buildPath({
        mode: "home",
        year: n.getFullYear(),
        month: n.getMonth(),
      }),
    );
  }

  function goShopping() {
    navigate(buildPath({ mode: "shopping" }));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-violet-200/60 dark:bg-violet-900/40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-sky-200/60 dark:bg-sky-900/40" />
          <div className="h-28 animate-pulse rounded-2xl bg-emerald-200/60 dark:bg-emerald-900/40" />
        </div>
        <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-violet-50 p-5 shadow-sm dark:from-emerald-950/40 dark:to-violet-950/30">
          <div className="h-24 animate-pulse rounded-xl bg-white/60 dark:bg-slate-800/60" />
        </section>
      </div>
    );
  }

  const hasHome =
    nextEvent || pendingTasks.length > 0 || lowStock.length > 0;

  return (
    <div className="space-y-4">
      <WhatToDoNowCard
        nextEvent={nextEvent}
        pendingTasks={pendingTasks}
        lowStock={lowStock}
        pendingShoppingCount={pendingShoppingCount}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WeatherCard />
        <DolarRatesCard />
      </div>

      {!hasHome ? (
        <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-violet-50 p-5 shadow-sm dark:from-emerald-950/40 dark:to-violet-950/30">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            Tu casa
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Sin eventos próximos ni tareas pendientes. Todo tranquilo.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goEvents}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-sm"
            >
              + Evento
            </button>
            <button
              type="button"
              onClick={goHome}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
            >
              + Tarea hogar
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-violet-50 p-5 shadow-sm dark:from-emerald-950/40 dark:to-violet-950/30 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Tu casa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lo que viene en hogar, fiestas y compras
            </p>
          </div>

          {nextEvent && (
            <button
              type="button"
              onClick={goEvents}
              className="w-full text-left rounded-2xl bg-white/90 dark:bg-slate-800/90 p-4 shadow-sm border border-violet-100 dark:border-violet-900/50 transition-colors hover:bg-white dark:hover:bg-slate-800"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                  <Cake className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-bold tabular-nums leading-none">
                    {nextEvent.days === 0
                      ? "!"
                      : nextEvent.days < 100
                        ? nextEvent.days
                        : "99+"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                    {formatCountdown(nextEvent.days)}
                  </span>
                  <span className="block text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                    {nextEvent.event.title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatEventDateLong(nextEvent.nextDate)}
                    {nextEvent.event.kind === "birthday" && (
                      <span className="text-violet-500"> · Cumpleaños</span>
                    )}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 mt-1" />
              </div>
            </button>
          )}

          {pendingTasks.length > 0 && (
            <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 p-4 shadow-sm">
              <button
                type="button"
                onClick={goHome}
                className="flex w-full items-center justify-between gap-2 mb-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <Home className="h-4 w-4 text-emerald-600" />
                  Tareas del hogar
                  <span className="text-xs font-normal text-slate-400">
                    ({pendingTasks.length} pendiente
                    {pendingTasks.length !== 1 ? "s" : ""})
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <ul className="space-y-2">
                {topTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-500 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{t.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {t.assignee}
                    </span>
                  </li>
                ))}
              </ul>
              {pendingTasks.length > 3 && (
                <button
                  type="button"
                  onClick={goHome}
                  className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  Ver las {pendingTasks.length - 3} restantes →
                </button>
              )}
            </div>
          )}

          {lowStock.length > 0 && (
            <button
              type="button"
              onClick={goShopping}
              className="flex w-full items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 p-3 text-left"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Inventario bajo
                </span>
                <span className="block text-xs text-amber-800/90 dark:text-amber-200/90 mt-0.5 line-clamp-2">
                  {lowStock.map((x) => x.name).join(", ")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-amber-600 shrink-0 mt-1" />
            </button>
          )}
        </section>
      )}

      <MedalsPanel
        userId={userId}
        eventCount={events.length}
        nextEventDays={nextEvent?.days ?? null}
        doneTaskCount={doneTasks.length}
        lowStockCount={lowStock.length}
      />
    </div>
  );
}
