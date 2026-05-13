import { useState, useRef } from "react";
import {
  PlusCircle,
  Loader2,
  ChevronDown,
  Paperclip,
  Camera,
  ImageIcon,
  CreditCard,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { parseAmount } from "../lib/amount";
import { NumericFormat } from "react-number-format";

const DEFAULT_CATEGORIES = {
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
  notes: "",
};

async function uploadReceipt(file, userId) {
  if (!file || !userId) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(path, file, { upsert: false });
  if (error) {
    console.warn("Receipt upload failed:", error.message);
    return null;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(data.path);
  return publicUrl;
}

export default function TransactionForm({
  onAdd,
  onAddInstallments,
  customCategories = [],
  onAddCategory,
  userId,
}) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [cuotas, setCuotas] = useState(false);
  const [numCuotas, setNumCuotas] = useState(3);
  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset category when type changes
      if (name === "type") {
        updated.category = DEFAULT_CATEGORIES[value][0];
      }
      // Strip non-numeric chars from amount while typing
      if (name === "amount") return prev; // handled by NumericFormat
      return updated;
    });
  }

  function handleReceiptChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("El archivo no puede superar 5 MB.");
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  async function handleAddCategory() {
    if (!newCatName.trim() || !onAddCategory) return;
    setSavingCat(true);
    const { error } = await onAddCategory(newCatName.trim(), form.type);
    setSavingCat(false);
    if (!error) {
      setForm((prev) => ({ ...prev, category: newCatName.trim() }));
      setNewCatName("");
      setAddingCat(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.description.trim()) {
      setFormError("La descripción es obligatoria.");
      return;
    }

    const parsedAmount = form.amount === "" ? null : form.amount;
    if (parsedAmount !== null && parsedAmount <= 0) {
      setFormError("Ingresá un monto válido mayor a 0.");
      return;
    }

    setSubmitting(true);

    // Upload receipt if selected (requires 'receipts' bucket in Supabase Storage)
    const receipt_url = showReceipt
      ? await uploadReceipt(receiptFile, userId)
      : null;

    const payload = {
      description: form.description.trim(),
      amount: parsedAmount,
      type: form.type,
      category: form.category,
    };
    // Only include notes if non-empty (requires ALTER TABLE transactions ADD COLUMN notes text)
    if (showNotes && form.notes.trim()) payload.notes = form.notes.trim();
    if (receipt_url) payload.receipt_url = receipt_url;

    let result;
    if (cuotas && numCuotas >= 2 && onAddInstallments) {
      const now = new Date();
      result = await onAddInstallments(
        payload,
        numCuotas,
        now.getFullYear(),
        now.getMonth(),
      );
    } else {
      result = await onAdd(payload);
    }
    setSubmitting(false);

    if (result?.error) {
      setFormError(`Error al guardar: ${result.error}`);
    } else {
      setForm(INITIAL_STATE);
      setShowNotes(false);
      setShowReceipt(false);
      setCuotas(false);
      setNumCuotas(3);
      setReceiptFile(null);
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  }

  const customCatsForType = customCategories
    .filter((c) => c.type === form.type)
    .map((c) => c.name);
  const allCategories = [
    ...DEFAULT_CATEGORIES[form.type],
    ...customCatsForType,
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm mb-6 space-y-4"
    >
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
        Nuevo movimiento
      </h2>

      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
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
                  : "bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
          >
            {t === "income" ? "↑ Ingreso" : "↓ Egreso"}
          </button>
        ))}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
          Descripción
        </label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Ej: Supermercado semanal"
          maxLength={120}
          className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        />
      </div>

      {/* Amount + Category row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            Monto
          </label>
          <NumericFormat
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            value={form.amount}
            onValueChange={({ floatValue }) =>
              setForm((p) => ({ ...p, amount: floatValue ?? "" }))
            }
            inputMode="decimal"
            placeholder="Sin monto"
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            Categoría
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
          >
            <optgroup label="Predefinidas">
              {DEFAULT_CATEGORIES[form.type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </optgroup>
            {customCatsForType.length > 0 && (
              <optgroup label="Mis categorías">
                {customCatsForType.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {/* Inline add category */}
          {!addingCat ? (
            <button
              type="button"
              onClick={() => setAddingCat(true)}
              className="mt-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} /> Nueva categoría
            </button>
          ) : (
            <div className="flex gap-1 mt-1">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddCategory())
                }
                placeholder="Nombre"
                maxLength={40}
                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={savingCat || !newCatName.trim()}
                className="px-2 py-1 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs disabled:opacity-50"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingCat(false);
                  setNewCatName("");
                }}
                className="px-1.5 py-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cuotas (solo egresos) */}
      {form.type === "expense" && (
        <div>
          <button
            type="button"
            onClick={() => setCuotas((s) => !s)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              cuotas
                ? "text-violet-500 dark:text-violet-400"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" strokeWidth={2} />
            {cuotas ? "Quitar cuotas" : "Pagar en cuotas"}
          </button>
          {cuotas && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNumCuotas((n) => Math.max(2, n - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Minus className="w-3 h-3" strokeWidth={2.5} />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  {numCuotas}
                </span>
                <button
                  type="button"
                  onClick={() => setNumCuotas((n) => Math.min(48, n + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                cuotas
                {form.amount > 0 && (
                  <span className="ml-1 font-medium text-violet-500 dark:text-violet-400">
                    de{" "}
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                    }).format(
                      Math.round((form.amount / numCuotas) * 100) / 100,
                    )}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Notes (optional) */}
      <div>
        <button
          type="button"
          onClick={() => setShowNotes((s) => !s)}
          className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showNotes ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
          {showNotes ? "Ocultar nota" : "Agregar nota"}
        </button>
        {showNotes && (
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Nota opcional…"
            rows={2}
            maxLength={300}
            className="mt-1.5 w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 resize-none"
          />
        )}
      </div>

      {/* Receipt (optional) — requires 'receipts' bucket in Supabase Storage */}
      <div>
        <button
          type="button"
          onClick={() => setShowReceipt((s) => !s)}
          className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Paperclip className="w-3.5 h-3.5" strokeWidth={2} />
          {showReceipt ? "Quitar comprobante" : "Adjuntar comprobante"}
        </button>
        {showReceipt && (
          <div className="mt-1.5 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="hidden"
            />
            <input
              ref={(el) => {
                if (el) el._isCamera = true;
              }}
              id="receipt-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptChange}
              className="hidden"
            />
            {!receiptPreview && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("receipt-camera-input")?.click()
                  }
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" strokeWidth={2} />
                  Cámara
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Galería
                </button>
              </div>
            )}
            {receiptPreview && (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="preview"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    URL.revokeObjectURL(receiptPreview);
                    setReceiptPreview(null);
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-800 rounded-full p-0.5 text-slate-400 hover:text-red-400 border border-slate-200 dark:border-slate-600"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        )}
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
