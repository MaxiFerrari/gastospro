import { useState, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useOutsideClick } from "@hooks/useOutsideClick";

const MONTHS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export default function MonthPicker({
  label,
  year,
  month,
  isCurrentMonth,
  onGoToCurrentMonth,
  transactions,
  goToPrev,
  goToNext,
  goToMonth,
  pickerPrevYear,
  pickerNextYear,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false), open);

  const monthsWithData = useMemo(() => {
    const s = new Set();
    for (const t of transactions) {
      const d = new Date(t.created_at);
      if (d.getUTCFullYear() === year) s.add(d.getUTCMonth());
    }
    return s;
  }, [transactions, year]);

  const monthsWithPending = useMemo(() => {
    const s = new Set();
    for (const t of transactions) {
      if (t.status === "pending") {
        const d = new Date(t.created_at);
        if (d.getUTCFullYear() === year) s.add(d.getUTCMonth());
      }
    }
    return s;
  }, [transactions, year]);

  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <div className="flex flex-col items-center gap-2 mb-4 px-1">
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={goToPrev}
          className="btn-icon flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {displayLabel} ▾
          </button>

          {open && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 w-64">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={pickerPrevYear}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Año anterior"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {year}
                </span>
                <button
                  type="button"
                  onClick={pickerNextYear}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Año siguiente"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              {!isCurrentMonth && onGoToCurrentMonth && (
                <button
                  type="button"
                  onClick={() => {
                    onGoToCurrentMonth();
                    setOpen(false);
                  }}
                  className="w-full mb-2 text-xs font-medium text-blue-600 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                >
                  Ir al mes actual
                </button>
              )}
              <div className="grid grid-cols-4 gap-1">
                {MONTHS_ES.map((name, i) => {
                  const isSelected = i === month;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        goToMonth(i, year);
                        setOpen(false);
                      }}
                      className={`relative py-1.5 rounded-xl text-xs font-medium transition-colors
                          ${isSelected ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                    >
                      {name}
                      {!isSelected &&
                        (monthsWithData.has(i) || monthsWithPending.has(i)) && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                            {monthsWithData.has(i) && (
                              <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                            )}
                            {monthsWithPending.has(i) && (
                              <span className="w-1 h-1 rounded-full bg-orange-400" />
                            )}
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          className="btn-icon flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {!isCurrentMonth && onGoToCurrentMonth && (
        <button
          type="button"
          onClick={onGoToCurrentMonth}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
        >
          Ir al mes actual
        </button>
      )}
    </div>
  );
}
