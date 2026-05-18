import { AlertCircle, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { useDolarRates } from "@views/me/hooks/useDolarRates";
import { formatArsCompact, formatCurrency } from "@lib/amount";

/**
 * @param {{ onUseRate?: (venta: number, label: string) => void; compact?: boolean }} props
 */
export default function DolarRatesCard({ onUseRate, compact = false }) {
  const { rates, loading, error, refresh } = useDolarRates({
    notifyErrors: true,
  });

  const rows = [
    { key: "oficial", label: "Oficial", data: rates?.oficial },
    { key: "blue", label: "Blue", data: rates?.blue },
    { key: "mep", label: "MEP", data: rates?.mep },
  ].filter((r) => r.data);

  return (
    <section className="app-hub-band w-full min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/40 sm:rounded-2xl sm:border-x sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Dólar hoy
          </h3>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
        </div>
        <button
          type="button"
          onClick={() => refresh({ notify: true })}
          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shrink-0"
          aria-label="Actualizar cotización"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <div className="mb-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="min-w-0 flex-1">{error}</span>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="grid w-full min-w-0 grid-cols-3 gap-1 sm:gap-2">
          {rows.map(({ key, label, data }) => (
            <button
              key={key}
              type="button"
              onClick={() => onUseRate?.(data.venta, label)}
              disabled={!onUseRate}
              className={`min-w-0 rounded-lg bg-white/80 dark:bg-slate-800/80 p-1.5 sm:p-2.5 text-left border border-emerald-100 dark:border-emerald-900/40 ${
                onUseRate
                  ? "hover:border-emerald-400 active:scale-[0.98] transition-transform"
                  : ""
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 truncate">
                {label}
              </p>
              <p className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums mt-0.5 truncate">
                <span className="sm:hidden">{formatArsCompact(data.venta)}</span>
                <span className="hidden sm:inline">{formatCurrency(data.venta, 0)}</span>
              </p>
              {!compact && (
                <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                  <span className="sm:hidden">C {formatArsCompact(data.compra)}</span>
                  <span className="hidden sm:inline">
                    Compra {formatCurrency(data.compra, 0)}
                  </span>
                </p>
              )}
            </button>
          ))}
        </div>
      ) : !loading ? (
        <p className="text-xs text-slate-500">Sin cotizaciones</p>
      ) : null}

      {onUseRate && rows.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-2 max-sm:hidden">
          Tocá una cotización para usarla en gastos USD
        </p>
      )}
    </section>
  );
}
