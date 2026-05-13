import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function MonthComparisonPanel({
  transactions,
  prevTransactions,
}) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const curr = {};
    const prev = {};
    for (const t of transactions) {
      if (t.type !== "expense" || !t.amount) continue;
      curr[t.category] = (curr[t.category] ?? 0) + t.amount;
    }
    for (const t of prevTransactions) {
      if (t.type !== "expense" || !t.amount) continue;
      prev[t.category] = (prev[t.category] ?? 0) + t.amount;
    }
    const cats = [...new Set([...Object.keys(curr), ...Object.keys(prev)])];
    return cats
      .map((cat) => ({
        category: cat,
        current: curr[cat] ?? 0,
        previous: prev[cat] ?? 0,
        delta: (curr[cat] ?? 0) - (prev[cat] ?? 0),
      }))
      .sort((a, b) => b.current - a.current);
  }, [transactions, prevTransactions]);

  const totals = useMemo(() => {
    const curr = transactions
      .filter((t) => t.type === "expense" && t.amount)
      .reduce((s, t) => s + t.amount, 0);
    const prev = prevTransactions
      .filter((t) => t.type === "expense" && t.amount)
      .reduce((s, t) => s + t.amount, 0);
    return { curr, prev, delta: curr - prev };
  }, [transactions, prevTransactions]);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Comparativa vs mes anterior
          </h2>
          {!open && totals.delta !== 0 && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                totals.delta > 0
                  ? "bg-red-100 dark:bg-red-950 text-red-500"
                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
              }`}
            >
              {totals.delta > 0 ? "+" : ""}
              {fmtARS.format(totals.delta)}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" strokeWidth={2} />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
        )}
      </button>

      {open && (
        <div className="px-5 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 font-medium">Categoría</th>
                  <th className="text-right py-2 font-medium">Mes ant.</th>
                  <th className="text-right py-2 font-medium">Este mes</th>
                  <th className="text-right py-2 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ category, current, previous, delta }) => {
                  const improved = delta < 0;
                  const unchanged = delta === 0;
                  return (
                    <tr
                      key={category}
                      className="border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                    >
                      <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                        {category}
                      </td>
                      <td className="py-2.5 text-right text-slate-400 dark:text-slate-500">
                        {previous > 0 ? fmtARS.format(previous) : "—"}
                      </td>
                      <td className="py-2.5 text-right text-slate-700 dark:text-slate-200 font-semibold">
                        {current > 0 ? fmtARS.format(current) : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        {unchanged || (previous === 0 && current === 0) ? (
                          <span className="text-slate-300 dark:text-slate-600">
                            <Minus
                              className="w-3.5 h-3.5 inline"
                              strokeWidth={2}
                            />
                          </span>
                        ) : (
                          <span
                            className={`flex items-center justify-end gap-0.5 font-medium ${
                              improved ? "text-emerald-500" : "text-red-400"
                            }`}
                          >
                            {improved ? (
                              <TrendingDown
                                className="w-3.5 h-3.5"
                                strokeWidth={2}
                              />
                            ) : (
                              <TrendingUp
                                className="w-3.5 h-3.5"
                                strokeWidth={2}
                              />
                            )}
                            {fmtARS.format(Math.abs(delta))}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-100 dark:border-slate-700 font-semibold">
                  <td className="pt-3 pb-1 text-slate-700 dark:text-slate-200">
                    Total
                  </td>
                  <td className="pt-3 pb-1 text-right text-slate-400 dark:text-slate-500">
                    {fmtARS.format(totals.prev)}
                  </td>
                  <td className="pt-3 pb-1 text-right text-slate-700 dark:text-slate-200">
                    {fmtARS.format(totals.curr)}
                  </td>
                  <td className="pt-3 pb-1 text-right">
                    <span
                      className={`flex items-center justify-end gap-0.5 ${
                        totals.delta < 0
                          ? "text-emerald-500"
                          : totals.delta > 0
                            ? "text-red-400"
                            : "text-slate-400"
                      }`}
                    >
                      {totals.delta < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
                      ) : totals.delta > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                      ) : null}
                      {fmtARS.format(Math.abs(totals.delta))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
