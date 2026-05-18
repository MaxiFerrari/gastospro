import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { SHOPPING_CONTEXTS, DEFAULT_SHOPPING_CONTEXT } from "@lib/shoppingContexts";
import { toast } from "@lib/toast";

export default function InventoryPanel({
  items,
  lowStock,
  onAdd,
  onUpdate: _onUpdate,
  onDelete,
  onAdjust,
  onAddToList,
}) {
  const [open, setOpen] = useState(lowStock.length > 0);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [minQ, setMinQ] = useState("1");
  const [currentQ, setCurrentQ] = useState("0");
  const [context, setContext] = useState(DEFAULT_SHOPPING_CONTEXT);

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name,
      minQuantity: parseFloat(minQ) || 1,
      currentQuantity: parseFloat(currentQ) || 0,
      context,
    });
    toast("Producto en inventario");
    setName("");
    setMinQ("1");
    setCurrentQ("0");
    setFormOpen(false);
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Inventario mínimo
          {lowStock.length > 0 && (
            <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              {lowStock.length} bajo stock
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
          {lowStock.length > 0 && (
            <ul className="space-y-2">
              {lowStock.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="flex-1 min-w-0 font-medium text-slate-800 dark:text-slate-100 truncate">
                    {row.name}
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-300 tabular-nums">
                    {row.currentQuantity}/{row.minQuantity} {row.unit}
                  </span>
                  {onAddToList && (
                    <button
                      type="button"
                      onClick={() => onAddToList(row)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      + Lista
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {items
                .filter((x) => !lowStock.some((l) => l.id === x.id))
                .map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-2 py-1.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <span className="flex-1 truncate">{row.name}</span>
                    <button
                      type="button"
                      onClick={() => onAdjust(row.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-12 text-center tabular-nums text-xs">
                      {row.currentQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjust(row.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-bold"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {formOpen ? (
            <form onSubmit={handleAdd} className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre (ej. Pañales)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentQ}
                  onChange={(e) => setCurrentQ(e.target.value)}
                  placeholder="Stock actual"
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={minQ}
                  onChange={(e) => setMinQ(e.target.value)}
                  placeholder="Mínimo"
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {SHOPPING_CONTEXTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar al inventario
            </button>
          )}
        </div>
      )}
    </section>
  );
}
