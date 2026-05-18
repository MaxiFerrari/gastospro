import { CloudSun, Loader2 } from "lucide-react";
import { useWeather } from "../hooks/useWeather";

export default function WeatherCard() {
  const { weather, loading, error } = useWeather();

  return (
    <section className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden>
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
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Hoy {weather.tempC}° · {weather.line}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {weather.hint}
              </p>
              {weather.forecast?.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:gap-2 lg:overflow-visible lg:pb-0">
                  {weather.forecast.map((day) => (
                    <div
                      key={day.date}
                      className="shrink-0 rounded-lg bg-white/70 dark:bg-slate-800/70 px-2.5 py-1.5 text-center min-w-[4.5rem] border border-sky-100 dark:border-sky-900/50 lg:min-w-0 lg:shrink"
                      title={day.date}
                    >
                      <p className="text-[10px] font-medium text-slate-500 capitalize">
                        {day.label}
                      </p>
                      <p className="text-lg leading-none my-0.5">{day.emoji}</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {day.max}° / {day.min}°
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {error ?? "Cargando clima…"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
