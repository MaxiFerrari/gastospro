import { SHOPPING_CONTEXTS } from "@lib/shoppingContexts";

export default function ShoppingContextBar({
  activeContext,
  pendingCounts,
  onSelect,
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeContext === "all"
            ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }`}
      >
        Todos
        {pendingCounts.all > 0 ? ` (${pendingCounts.all})` : ""}
      </button>
      {SHOPPING_CONTEXTS.map((ctx) => {
        const n = pendingCounts[ctx.id] ?? 0;
        return (
          <button
            key={ctx.id}
            type="button"
            onClick={() => onSelect(ctx.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeContext === ctx.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {ctx.emoji} {ctx.label}
            {n > 0 ? ` (${n})` : ""}
          </button>
        );
      })}
    </div>
  );
}
