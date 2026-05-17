import { ArrowLeft, Check } from "lucide-react";
import { getShoppingContext } from "../lib/shoppingContexts";

export default function SupermarketMode({
  contextId,
  items,
  onToggle,
  onExit,
}) {
  const ctx = getShoppingContext(contextId);
  const pending = items.filter((i) => !i.completed);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          type="button"
          onClick={onExit}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Salir del modo supermercado"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
            Modo supermercado
          </p>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
            {ctx.emoji} {ctx.label}
          </h2>
        </div>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
          {pending.length}
        </span>
      </header>

      <ul className="flex-1 overflow-y-auto px-3 py-3 space-y-2 pb-24">
        {pending.length === 0 ? (
          <li className="text-center py-16 text-slate-400 text-sm">
            ¡Lista completa para este contexto!
          </li>
        ) : (
          pending.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id, item.completed)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] active:bg-emerald-50 dark:active:bg-emerald-950/30 transition-all text-left min-h-[4.5rem]"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-transparent" strokeWidth={3} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {item.name}
                  </span>
                  {(item.quantity > 1 || item.brand) && (
                    <span className="block text-sm text-slate-400 mt-0.5">
                      {item.quantity > 1 ? `×${item.quantity} ` : ""}
                      {item.brand || ""}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
