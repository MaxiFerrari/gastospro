import { AlertCircle, CloudSun, Loader2 } from "lucide-react";
import { useWeather } from "@views/me/hooks/useWeather";

export default function WeatherCard() {
  const { weather, loading, error } = useWeather();

  return (
    <section className="app-hub-band w-full min-w-0 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 p-3 dark:border-sky-900/50 dark:bg-sky-950/40 sm:rounded-2xl sm:border-x sm:p-4">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="text-xl shrink-0 sm:text-2xl" aria-hidden>
          {weather?.emoji ?? "🌤️"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <CloudSun className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <h3 className="text-sm font-semibold text-sky-900 dark:text-sky-100">
              Clima
            </h3>
            {loading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
            )}
          </div>
          {weather ? (
            <>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                Hoy {weather.tempC}° · {weather.line}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {weather.hint}
              </p>
            </>
          ) : error ? (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cargando clima…
            </p>
          )}
        </div>
      </div>

      {weather?.forecast?.length > 0 && (
        <div
          className="mt-3 grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-1"
          role="list"
          aria-label="Pronóstico 7 días"
        >
          {weather.forecast.map((day) => (
            <div
              key={day.date}
              role="listitem"
              className="min-w-0 rounded-md border border-sky-100 bg-white/70 px-0.5 py-1 text-center dark:border-sky-900/50 dark:bg-slate-800/70 sm:px-1 sm:py-1.5"
              title={day.date}
            >
              <p className="text-[9px] font-medium text-slate-500 capitalize leading-tight truncate sm:text-[10px]">
                {day.label}
              </p>
              <p className="text-base leading-none my-0.5 sm:text-lg">{day.emoji}</p>
              <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums leading-tight sm:text-xs">
                {day.max}°
              </p>
              <p className="text-[9px] text-slate-400 tabular-nums leading-tight">
                {day.min}°
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
