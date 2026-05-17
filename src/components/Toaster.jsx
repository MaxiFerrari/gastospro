import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";
import { _subscribe } from "../lib/toast";

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return _subscribe((t) => {
      setToasts((prev) => [...prev, t]);
      // Confirm toasts stay until the user acts; others auto-dismiss
      if (t.type !== "confirm") {
        setTimeout(
          () => setToasts((prev) => prev.filter((x) => x.id !== t.id)),
          3500,
        );
      }
    });
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="app-floating-bottom fixed right-3 sm:right-5 sm:bottom-5 z-[90] flex flex-col gap-2 pointer-events-none max-w-[min(100%-1.5rem,20rem)]">
      {toasts.map((t) =>
        t.type === "confirm" ? (
          <div
            key={t.id}
            className="toast-enter flex flex-col gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto w-72 bg-slate-800 dark:bg-white text-white dark:text-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <Trash2
                className="w-4 h-4 flex-shrink-0 text-gp-expense-text"
                strokeWidth={2}
              />
              <span className="flex-1">{t.message}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  t.onConfirm?.();
                  dismiss(t.id);
                }}
                className="flex-1 py-1.5 rounded-lg bg-gp-danger hover:bg-gp-danger-hover text-white text-xs font-semibold transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-1 py-1.5 rounded-lg bg-slate-600 dark:bg-slate-200 hover:bg-slate-500 dark:hover:bg-slate-300 text-white dark:text-slate-800 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            key={t.id}
            className={`toast-enter flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto max-w-xs ${
              t.type === "error"
                ? "bg-gp-danger text-white"
                : t.type === "warning"
                  ? "bg-gp-pending text-white"
                  : "bg-slate-800 dark:bg-white text-white dark:text-slate-800"
            }`}
          >
            {t.type === "error" ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            ) : t.type === "warning" ? (
              <AlertTriangle
                className="w-4 h-4 flex-shrink-0"
                strokeWidth={2}
              />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity ml-1"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ),
      )}
    </div>
  );
}
