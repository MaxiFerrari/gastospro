import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

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

const INITIAL_STATE = {
  description: "",
  amount: "",
  type: "expense",
  category: "Alimentación",
};

export default function TransactionForm({ onAdd }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset category when type changes
      if (name === "type") {
        updated.category = CATEGORIES[value][0];
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(form.amount);
    if (!form.description.trim()) {
      setFormError("La descripción es obligatoria.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setFormError("Ingresá un monto válido mayor a 0.");
      return;
    }

    setSubmitting(true);
    const result = await onAdd({
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
    });
    setSubmitting(false);

    if (result?.error) {
      setFormError(`Error al guardar: ${result.error}`);
    } else {
      setForm(INITIAL_STATE);
    }
  }

  const categories = CATEGORIES[form.type];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-5 shadow-sm mb-6 space-y-4"
    >
      <h2 className="text-base font-semibold text-slate-700">
        Nuevo movimiento
      </h2>

      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleChange({ target: { name: "type", value: t } })}
            className={`flex-1 py-2 text-sm font-semibold transition-colors
              ${
                form.type === t
                  ? t === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-red-400 text-white"
                  : "bg-white text-slate-400 hover:bg-slate-50"
              }`}
          >
            {t === "income" ? "↑ Ingreso" : "↓ Egreso"}
          </button>
        ))}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-slate-500 mb-1 font-medium">
          Descripción
        </label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Ej: Supermercado semanal"
          maxLength={120}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Amount + Category row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1 font-medium">
            Monto
          </label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1 font-medium">
            Categoría
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {formError && (
        <p className="text-xs text-red-500 font-medium">{formError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all
          ${
            form.type === "income"
              ? "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700"
              : "bg-red-400 hover:bg-red-500 active:bg-red-600"
          }
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PlusCircle className="w-4 h-4" />
        )}
        {submitting ? "Guardando…" : "Agregar"}
      </button>
    </form>
  );
}
