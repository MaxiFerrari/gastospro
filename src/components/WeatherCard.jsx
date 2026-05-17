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
              Clima de hoy
            </h3>
            {loading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
            )}
          </div>
          {weather ? (
            <>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {weather.tempC}° · {weather.line}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {weather.hint}
              </p>
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
