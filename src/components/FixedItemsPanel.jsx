import { useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Car,
  Home,
  Heart,
  Music,
  Shirt,
  BookOpen,
  Zap,
  ArrowUpCircle,
  Briefcase,
  TrendingUp,
  Gift,
  DollarSign,
  HelpCircle,
} from "lucide-react";

const CATEGORIES = {
  income: ["Salario", "Freelance", "Inversiones", "Alquiler", "Regalo", "Otro"],
  expense: [
    "Alimentación",
    "Transporte",
    "Vivienda",
    "Salud",
    "Entretenimiento",
    "Ropa",
    "Educación",
    "Servicios",
    "Otro",
  ],
};

const CATEGORY_ICONS = {
  Alimentación: ShoppingCart,
  Transporte: Car,
  Vivienda: Home,
  Salud: Heart,
  Entretenimiento: Music,
  Ropa: Shirt,
  Educación: BookOpen,
  Servicios: Zap,
  Salario: Briefcase,
  Freelance: ArrowUpCircle,
  Inversiones: TrendingUp,
  Alquiler: Home,
  Regalo: Gift,
  Otro: DollarSign,
};

// A single pending fixed item row with inline amount entry
function PendingFixedItem({ item, onFill }) {
  const Icon = CATEGORY_ICONS[item.category] ?? HelpCircle;
  const isIncome = item.type === "income";
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFill() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    await onFill(item, parsed);
    setSaving(false);
    setAmount("");
  }

  return (
    <div className="flex items-center gap-2 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div
        className={`flex-shrink-0 p-2 rounded-xl ${isIncome ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}
      >
        <Icon
          className={`w-4 h-4 ${isIncome ? "text-emerald-500" : "text-red-400"}`}
          strokeWidth={2}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {item.description}
        </p>
        <p className="text-xs text-slate-400">{item.category}</p>
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleFill()}
        placeholder="Monto"
        min="0.01"
        step="0.01"
        className="w-24 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-2 py-1.5 text-slate-700 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
      />
      <button
        onClick={handleFill}
        disabled={saving || !amount}
        className="flex-shrink-0 p-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Confirmar monto"
      >
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// Management row: shows existing fixed item with delete option
function FixedItemRow({ item, onDelete }) {
  const Icon = CATEGORY_ICONS[item.category] ?? HelpCircle;
  const isIncome = item.type === "income";
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div
        className={`flex-shrink-0 p-1.5 rounded-xl ${isIncome ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${isIncome ? "text-emerald-500" : "text-red-400"}`}
          strokeWidth={2}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {item.description}
        </p>
        <p className="text-xs text-slate-400">{item.category}</p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        aria-label="Eliminar fijo"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

// Add fixed item mini-form
function AddFixedItemForm({ onAdd }) {
  const [form, setForm] = useState({
    description: "",
    type: "expense",
    category: "Alimentación",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "type") updated.category = CATEGORIES[value][0];
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    setError(null);
    setSaving(true);
    const result = await onAdd({
      description: form.description.trim(),
      type: form.type,
      category: form.category,
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setForm({ description: "", type: "expense", category: "Alimentación" });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleChange({ target: { name: "type", value: t } })}
            className={`flex-1 py-1.5 text-xs font-semibold transition-colors
              ${
                form.type === t
                  ? t === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-red-400 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
          >
            {t === "income" ? "↑ Ingreso" : "↓ Egreso"}
          </button>
        ))}
      </div>
      <input
        type="text"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Ej: Alquiler, Gym, Netflix..."
        maxLength={120}
        className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
      />
      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
      >
        {CATEGORIES[form.type].map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Agregar fijo
      </button>
    </form>
  );
}

export default function FixedItemsPanel({
  fixedItems,
  pendingItems,
  onFill,
  onAdd,
  onDelete,
}) {
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Pending items for this month */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Fijos del mes
          </h2>
          <span className="text-xs text-slate-400">
            {pendingItems.length === 0
              ? "Todo cargado ✓"
              : `${pendingItems.length} pendiente${pendingItems.length > 1 ? "s" : ""}`}
          </span>
        </div>

        {pendingItems.length === 0 && fixedItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No tenés gastos fijos configurados.
          </p>
        ) : pendingItems.length === 0 ? (
          <p className="text-xs text-emerald-600 font-medium py-2">
            Todos los fijos del mes ya están cargados.
          </p>
        ) : (
          <div>
            {pendingItems.map((item) => (
              <PendingFixedItem key={item.id} item={item} onFill={onFill} />
            ))}
          </div>
        )}
      </div>

      {/* Manage fixed items toggle */}
      <div className="border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setManageOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="font-medium">
            Administrar fijos ({fixedItems.length})
          </span>
          {manageOpen ? (
            <ChevronUp className="w-4 h-4" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        {manageOpen && (
          <div className="px-5 pb-5">
            {fixedItems.length > 0 && (
              <div className="mb-2">
                {fixedItems.map((item) => (
                  <FixedItemRow key={item.id} item={item} onDelete={onDelete} />
                ))}
              </div>
            )}
            <AddFixedItemForm onAdd={onAdd} />
          </div>
        )}
      </div>
    </div>
  );
}
