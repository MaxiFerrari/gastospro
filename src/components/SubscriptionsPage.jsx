import { useState, useMemo } from "react";
import { NumericFormat } from "react-number-format";
import { Plus, Trash2, Pencil, CreditCard, Banknote, Link } from "lucide-react";
import { ICON_OPTIONS, SubIcon, getIconOption } from "../lib/subscriptionIcons";

const BILLING_CYCLE_LABEL = { monthly: "mensual", annual: "anual" };

const fmt = (amount, currency) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function daysUntil(day) {
  if (!day) return null;
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target < now) target.setMonth(target.getMonth() + 1);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function annualRenewalDate(startDateStr) {
  if (!startDateStr) return null;
  const start = new Date(startDateStr + "T00:00:00");
  const now = new Date();
  const renewal = new Date(start);
  renewal.setFullYear(now.getFullYear());
  if (renewal < now) renewal.setFullYear(now.getFullYear() + 1);
  return renewal;
}

// ── Add / Edit form ──────────────────────────────────────────────────────────

const EMPTY = {
  name: "",
  amount: "",
  currency: "ARS",
  billing_cycle: "monthly",
  billing_day: "",
  start_date: "",
  payment_method: "auto-debit",
  linked_fixed_item_id: "",
  emoji: "card",
  notes: "",
};

function SubscriptionForm({
  initial = EMPTY,
  fixedItems = [],
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [showIconPicker, setShowIconPicker] = useState(false);

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    const payload = {
      name: form.name.trim(),
      amount: form.amount,
      currency: form.currency,
      billing_cycle: form.billing_cycle,
      billing_day: form.billing_day ? Number(form.billing_day) : null,
      start_date:
        form.billing_cycle === "annual" ? form.start_date || null : null,
      payment_method: form.payment_method,
      linked_fixed_item_id: form.linked_fixed_item_id || null,
      emoji: form.emoji,
      notes: (form.notes ?? "").trim() || null,
    };
    onSave(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 space-y-3"
    >
      {/* Icon + Name row */}
      <div className="flex gap-2 items-start">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIconPicker((o) => !o)}
            className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            <SubIcon iconKey={form.emoji} />
          </button>
          {showIconPicker && (
            <div className="absolute top-12 left-0 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-2 shadow-lg grid grid-cols-5 gap-1">
              {ICON_OPTIONS.map(({ key, Icon, label, color }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => {
                    set("emoji", key);
                    setShowIconPicker(false);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${color} ${form.emoji === key ? "ring-2 ring-slate-400 dark:ring-slate-300" : "opacity-70 hover:opacity-100"}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Nombre (ej: Netflix)"
          maxLength={60}
          required
          className="flex-1 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        />
      </div>

      {/* Amount + Currency + Cycle */}
      <div className="flex gap-2">
        <NumericFormat
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          allowNegative={false}
          value={form.amount}
          onValueChange={({ floatValue }) => set("amount", floatValue ?? "")}
          inputMode="decimal"
          placeholder="Monto"
          required
          className="flex-1 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        />
        <select
          value={form.currency}
          onChange={(e) => set("currency", e.target.value)}
          className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
        <select
          value={form.billing_cycle}
          onChange={(e) => set("billing_cycle", e.target.value)}
          className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        >
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
        </select>
      </div>

      {/* Billing day (monthly) / Start date (annual) + Payment method */}
      <div className="flex gap-2">
        <div className="flex-1">
          {form.billing_cycle === "monthly" ? (
            <>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Día de cobro (opcional)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={form.billing_day}
                onChange={(e) => set("billing_day", e.target.value)}
                placeholder="Ej: 15"
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
              />
            </>
          ) : (
            <>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
              />
            </>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            Forma de pago
          </label>
          <select
            value={form.payment_method}
            onChange={(e) => set("payment_method", e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
          >
            <option value="auto-debit">Débito automático</option>
            <option value="direct">Efectivo / transferencia</option>
          </select>
        </div>
      </div>

      {/* Linked fixed item (optional) */}
      {fixedItems.length > 0 && (
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            Vinculada a ítem fijo (opcional)
          </label>
          <select
            value={form.linked_fixed_item_id}
            onChange={(e) => set("linked_fixed_item_id", e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
          >
            <option value="">Sin vincular</option>
            {fixedItems.map((fi) => (
              <option key={fi.id} value={fi.id}>
                {fi.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({ sub, fixedItems, onToggle, onEdit, onDelete }) {
  const linkedItem = fixedItems.find(
    (fi) => fi.id === sub.linked_fixed_item_id,
  );
  const days =
    sub.billing_cycle === "monthly" ? daysUntil(sub.billing_day) : null;
  const renewalDate =
    sub.billing_cycle === "annual" ? annualRenewalDate(sub.start_date) : null;
  const renewalDays = renewalDate
    ? Math.ceil((renewalDate - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const soon =
    (days != null && days <= 3) || (renewalDays != null && renewalDays <= 7);
  const soonDays = days ?? renewalDays;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-opacity ${sub.active ? "opacity-100" : "opacity-50"}`}
    >
      {/* Icon */}
      <SubIcon iconKey={sub.emoji} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className={`text-sm font-semibold truncate ${sub.active ? "text-slate-700 dark:text-slate-200" : "text-slate-400 line-through"}`}
          >
            {sub.name}
          </p>
          {!sub.active && (
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
              Cancelada
            </span>
          )}
          {soon && sub.active && (
            <span className="text-xs bg-red-100 dark:bg-red-950 text-red-500 font-medium px-1.5 py-0.5 rounded-full">
              {soonDays === 0
                ? "Hoy"
                : `En ${soonDays} día${soonDays !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {fmt(sub.amount, sub.currency)} ·{" "}
            {BILLING_CYCLE_LABEL[sub.billing_cycle]}
          </span>
          {sub.billing_day && !soon && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              día {sub.billing_day}
            </span>
          )}
          {renewalDate && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Renueva{" "}
              {renewalDate.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <span
            className={`text-xs flex items-center gap-0.5 ${sub.payment_method === "auto-debit" ? "text-violet-500 dark:text-violet-400" : "text-emerald-500"}`}
          >
            {sub.payment_method === "auto-debit" ? (
              <>
                <CreditCard className="w-3 h-3" strokeWidth={2} /> Débito auto
              </>
            ) : (
              <>
                <Banknote className="w-3 h-3" strokeWidth={2} /> Directo
              </>
            )}
          </span>
          {linkedItem && (
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
              <Link className="w-3 h-3" strokeWidth={2} />
              {linkedItem.description}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggle(sub.id)}
          title={sub.active ? "Marcar como cancelada" : "Reactivar"}
          className={`relative w-10 h-6 rounded-full transition-colors ${sub.active ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-600"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${sub.active ? "left-4" : "left-0.5"}`}
          />
        </button>
        <button
          onClick={() => onEdit(sub)}
          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        <button
          onClick={() => onDelete(sub.id)}
          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SubscriptionsPage({
  subscriptions,
  fixedItems = [],
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // sub object being edited

  const summary = useMemo(() => {
    const active = subscriptions.filter((s) => s.active);
    const arsMonthly = active
      .filter((s) => s.currency === "ARS")
      .reduce(
        (sum, s) =>
          sum + (s.billing_cycle === "annual" ? s.amount / 12 : s.amount),
        0,
      );
    const usdMonthly = active
      .filter((s) => s.currency === "USD")
      .reduce(
        (sum, s) =>
          sum + (s.billing_cycle === "annual" ? s.amount / 12 : s.amount),
        0,
      );
    return {
      arsMonthly,
      usdMonthly,
      activeCount: active.length,
      totalCount: subscriptions.length,
    };
  }, [subscriptions]);

  const fmtARS = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const fmtUSD = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  async function handleAdd(payload) {
    await onAdd(payload);
    setAdding(false);
  }

  async function handleUpdate(payload) {
    await onUpdate(editing.id, payload);
    setEditing(null);
  }

  const active = subscriptions.filter((s) => s.active);
  const inactive = subscriptions.filter((s) => !s.active);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-1">
            Costo mensual estimado
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {fmtARS.format(summary.arsMonthly)}
            </span>
            {summary.usdMonthly > 0 && (
              <span className="text-base font-semibold text-emerald-600">
                + {fmtUSD.format(summary.usdMonthly)}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-1">
            Activas
          </p>
          <p className="text-2xl font-bold text-emerald-500">
            {summary.activeCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-1">
            Total
          </p>
          <p className="text-2xl font-bold text-slate-500 dark:text-slate-400">
            {summary.totalCount}
          </p>
        </div>
      </div>

      {/* Add button / form */}
      {adding ? (
        <SubscriptionForm
          fixedItems={fixedItems}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-500 dark:hover:text-slate-400 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva suscripción
        </button>
      )}

      {/* Active subscriptions */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((sub) =>
            editing?.id === sub.id ? (
              <SubscriptionForm
                key={sub.id}
                initial={sub}
                fixedItems={fixedItems}
                onSave={handleUpdate}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                fixedItems={fixedItems}
                onToggle={onToggle}
                onEdit={setEditing}
                onDelete={onDelete}
              />
            ),
          )}
        </div>
      )}

      {/* Inactive subscriptions */}
      {inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-1">
            Canceladas
          </p>
          {inactive.map((sub) =>
            editing?.id === sub.id ? (
              <SubscriptionForm
                key={sub.id}
                initial={sub}
                fixedItems={fixedItems}
                onSave={handleUpdate}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                fixedItems={fixedItems}
                onToggle={onToggle}
                onEdit={setEditing}
                onDelete={onDelete}
              />
            ),
          )}
        </div>
      )}

      {subscriptions.length === 0 && !adding && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm font-medium">
            No tenés suscripciones registradas
          </p>
          <p className="text-xs mt-1">
            Agregá Netflix, Spotify, o cualquier servicio recurrente
          </p>
        </div>
      )}
    </div>
  );
}
