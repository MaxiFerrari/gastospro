import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  Loader2,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { formatGoogleEventWhen } from "../lib/googleCalendar";
import { GOOGLE_CALENDAR_SETUP_STEPS } from "../lib/googleCalendarSetupHelp";
import { useAuth } from "../hooks/useAuth";

/**
 * @param {{
 *   userId: string;
 *   variant?: 'home' | 'hub';
 *   maxItems?: number;
 * }} props
 */
export default function GoogleCalendarPanel({
  userId,
  variant = "hub",
  maxItems,
}) {
  const limit = maxItems ?? (variant === "home" ? 4 : 12);
  const { session } = useAuth();
  const {
    events,
    loading,
    error,
    needsAuth,
    optIn,
    canUseGoogle,
    connect,
    disconnect,
    refresh,
  } = useGoogleCalendar(userId, { maxResults: limit });

  const userEmail = session?.user?.email ?? "";

  const visible = events.slice(0, limit);
  const compact = variant === "home";

  if (!canUseGoogle && !optIn) {
    return null;
  }

  return (
    <section
      className={
        compact
          ? "app-hub-band w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/40 sm:rounded-2xl sm:border-x sm:p-4"
          : "rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40 sm:p-5"
      }
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            Google Calendar
          </h3>
          {loading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
          )}
        </div>
        {optIn && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => refresh({ notify: true, skipCache: true })}
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              aria-label="Actualizar calendario"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {!compact && (
              <button
                type="button"
                onClick={disconnect}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                aria-label="Desconectar calendario"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {!optIn ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
            Mostrá tus próximos compromisos del calendario de Google en Inicio y
            Celebraciones.
          </p>
          <button
            type="button"
            onClick={connect}
            className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.99]"
          >
            Conectar Google Calendar
          </button>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Solo lectura. Vas a autorizar el acceso con tu cuenta de Google.
          </p>
          <GoogleOAuthSetupHelp email={userEmail} />
        </div>
      ) : (
        <>
          {(error || needsAuth) && (
            <div className="mb-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 space-y-2">
                <span>{error}</span>
                {needsAuth && (
                  <button
                    type="button"
                    onClick={connect}
                    className="block font-semibold underline"
                  >
                    Volver a autorizar
                  </button>
                )}
                <GoogleOAuthSetupHelp email={userEmail} />
              </div>
            </div>
          )}

          {visible.length > 0 ? (
            <ul className="space-y-1.5">
              {visible.map((ev) => (
                <li key={ev.id}>
                  {ev.htmlLink ? (
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 rounded-lg bg-white/80 px-2.5 py-2 text-left border border-indigo-100 dark:border-indigo-900/40 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800"
                    >
                      <EventRow ev={ev} compact={compact} showLink />
                    </a>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg bg-white/80 px-2.5 py-2 border border-indigo-100 dark:border-indigo-900/40 dark:bg-slate-800/80">
                      <EventRow ev={ev} compact={compact} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : !loading && !error ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No hay eventos próximos en tu calendario principal.
            </p>
          ) : null}

          {compact && optIn && (
            <button
              type="button"
              onClick={disconnect}
              className="mt-2 text-[10px] text-slate-400 underline"
            >
              Desconectar
            </button>
          )}
        </>
      )}
    </section>
  );
}

/**
 * @param {{ ev: { title: string; start: Date; allDay: boolean; location?: string | null }; compact?: boolean; showLink?: boolean }} props
 */
/**
 * @param {{ email?: string }} props
 */
function GoogleOAuthSetupHelp({ email }) {
  return (
    <details className="mt-2 rounded-lg border border-indigo-200/80 bg-white/60 p-2 dark:border-indigo-800/50 dark:bg-slate-900/40">
      <summary className="cursor-pointer text-[10px] font-semibold text-indigo-800 dark:text-indigo-200">
        ¿Google dice «Access blocked» o error 403?
      </summary>
      <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-300 leading-snug">
        Es la pantalla de consentimiento de Google (no GastosPro). En modo{" "}
        <strong>Testing</strong> solo entran correos agregados como{" "}
        <strong>Test users</strong>
        {email ? (
          <>
            {" "}
            — usá exactamente: <code className="text-[9px]">{email}</code>
          </>
        ) : null}
        .
      </p>
      <ol className="mt-2 list-decimal list-inside space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
        {GOOGLE_CALENDAR_SETUP_STEPS.map((step) => (
          <li key={step} className="leading-snug">
            {step}
          </li>
        ))}
      </ol>
    </details>
  );
}

/**
 * @param {{ ev: { title: string; start: Date; allDay: boolean; location?: string | null }; compact?: boolean; showLink?: boolean }} props
 */
function EventRow({ ev, compact, showLink }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span
          className={`block font-semibold text-slate-800 dark:text-slate-100 truncate ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {ev.title}
        </span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate sm:text-xs">
          {formatGoogleEventWhen(ev.start, ev.allDay)}
          {ev.location ? ` · ${ev.location}` : ""}
        </span>
      </span>
      {showLink && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-indigo-400 mt-0.5" />
      )}
    </>
  );
}
