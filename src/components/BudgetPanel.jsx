import { useState, useMemo } from "react";
import { formatCurrency } from "../lib/amount";
import NumericInput from "./NumericInput";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function ProgressBar({ pct, over }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          over ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500"
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function BudgetRow({ category, spent, budget, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(budget ?? "");

  const pct = budget ? (spent / budget) * 100 : null;
  const over = pct != null && pct > 100;

  function handleSave() {
    if (!value && value !== 0) return;
    onSave(category, value);
    setEditing(false);
  }

  function handleCancel() {
    setValue(budget ?? "");
    setEditing(false);
  }

  return (
    <div className="py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1">
          {category}
        </span>

        {editing ? (
          <div className="flex items-center gap-1">
            <NumericInput
              decimalScale={0}
              inputMode="numeric"
              value={value}
              onValueChange={({ floatValue }) => setValue(floatValue ?? "")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
              placeholder="Límite"
              className="w-28 text-sm rounded-lg px-2 py-1"
            />
            <button
              onClick={handleSave}
              className="p-1 text-emerald-500 hover:text-emerald-600"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
              {formatCurrency(spent, 0)}
              {budget != null && (
                <span className="text-slate-400 dark:text-slate-500">
                  {" "}
                  / {formatCurrency(budget, 0)}
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setValue(budget ?? "");
                setEditing(true);
              }}
              className="p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
              title="Editar presupuesto"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            {budget != null && (
              <button
                onClick={() => onDelete(category)}
                className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                title="Quitar límite"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>

      {budget != null ? (
        <div className="flex items-center gap-2">
          <ProgressBar pct={pct} over={over} />
          <span
            className={`text-xs tabular-nums w-10 text-right shrink-0 ${
              over
                ? "text-red-500 font-semibold"
                : pct >= 80
                  ? "text-amber-500 font-medium"
                  : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {Math.round(pct)}%
          </span>
        </div>
      ) : (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full" />
      )}
    </div>
  );
}

export default function BudgetPanel({
  transactions,
  budgets,
  onSave,
  onDelete,
}) {
  const [open, setOpen] = useState(false);

  // Build map of spent per expense category this month
  const spentMap = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (t.type === "expense" && t.amount != null) {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      }
    }
    return map;
  }, [transactions]);

  // Union of categories with spending this month + categories with a budget set
  const categories = useMemo(() => {
    const set = new Set([
      ...Object.keys(spentMap),
      ...budgets.map((b) => b.category),
    ]);
    return [...set].sort((a, b) => {
      // Sort: over budget first, then by % used desc, then alphabetical
      const bA = budgets.find((b) => b.category === a);
      const bB = budgets.find((b) => b.category === b.category);
      const pctA = bA ? ((spentMap[a] ?? 0) / bA.amount) * 100 : 0;
      const pctB = bB ? ((spentMap[b] ?? 0) / bB.amount) * 100 : 0;
      return pctB - pctA || a.localeCompare(b);
    });
  }, [spentMap, budgets]);

  if (categories.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Presupuesto por categoría
          </h2>
          {budgets.length > 0 && (
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {budgets.filter((b) => (spentMap[b.category] ?? 0) > b.amount)
                .length > 0
                ? `${budgets.filter((b) => (spentMap[b.category] ?? 0) > b.amount).length} excedido${budgets.filter((b) => (spentMap[b.category] ?? 0) > b.amount).length !== 1 ? "s" : ""}`
                : `${budgets.length} límite${budgets.length !== 1 ? "s" : ""}`}
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
          {categories.map((cat) => (
            <BudgetRow
              key={cat}
              category={cat}
              spent={spentMap[cat] ?? 0}
              budget={budgets.find((b) => b.category === cat)?.amount ?? null}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
