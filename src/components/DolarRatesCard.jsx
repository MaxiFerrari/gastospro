import { DollarSign, Loader2, RefreshCw } from "lucide-react";
import { useDolarRates } from "../hooks/useDolarRates";
import { formatCurrency } from "../lib/amount";

/**
 * @param {{ onUseRate?: (venta: number, label: string) => void; compact?: boolean }} props
 */
export default function DolarRatesCard({ onUseRate, compact = false }) {
  const { rates, loading, error, refresh } = useDolarRates();

  const rows = [
    { key: "oficial", label: "Oficial", data: rates?.oficial },
    { key: "blue", label: "Blue", data: rates?.blue },
    { key: "mep", label: "MEP", data: rates?.mep },
  ].filter((r) => r.data);

  return (
    <section className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Dólar hoy
          </h3>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
        </div>
        <button
          type="button"
          onClick={refresh}
          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
          aria-label="Actualizar cotización"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && !rates && (
        <p className="text-xs text-slate-500">{error}</p>
      )}

      {rows.length > 0 ? (
        <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
          {rows.map(({ key, label, data }) => (
            <button
              key={key}
              type="button"
              onClick={() => onUseRate?.(data.venta, label)}
              disabled={!onUseRate}
              className={`rounded-xl bg-white/80 dark:bg-slate-800/80 p-2.5 text-left border border-emerald-100 dark:border-emerald-900/40 ${
                onUseRate
                  ? "hover:border-emerald-400 active:scale-[0.98] transition-transform"
                  : ""
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {label}
              </p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
                {formatCurrency(data.venta, 0)}
              </p>
              {!compact && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Compra {formatCurrency(data.compra, 0)}
                </p>
              )}
            </button>
          ))}
        </div>
      ) : !loading ? (
        <p className="text-xs text-slate-500">Sin cotizaciones</p>
      ) : null}

      {onUseRate && rows.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-2">
          Tocá una cotización para usarla en gastos USD
        </p>
      )}
    </section>
  );
}
