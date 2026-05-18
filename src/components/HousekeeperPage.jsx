import { useState, useEffect } from "react";
import AmountField from "./ui/AmountField";
import {
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { useHousekeeper } from "../hooks/useHousekeeper";

function dateToDisplay(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function displayToDate(display) {
  const [d, m, y] = display.split("/");
  return `${y}-${m}-${d}`;
}

function totalHours(hours, minutes) {
  return hours + minutes / 60;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(dateStr) {
  return new Date(dateStr + "T12:00:00");
}

function dailyPay(hours, minutes, settings) {
  const total = hours + minutes / 60;
  return total * settings.hourlyRate + settings.mobilityRate;
}

function HousekeeperPage({
  userId,
  year,
  month,
  transactions = [],
  addTransaction,
  deleteTransaction,
  updateTransaction,
}) {
  const {
    settings,
    saveSettings,
    entries,
    addEntry,
    removeEntry,
    updateEntry,
    loading,
    error: housekeeperError,
  } = useHousekeeper(userId);

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter((e) => e.date.startsWith(monthKey));

  // ── Monthly summary ────────────────────────────────────────────────────
  const totalDays = monthEntries.length;
  const totalMinutes = monthEntries.reduce(
    (sum, e) => sum + (e.minutes || 0),
    0,
  );
  const totalHoursRaw = monthEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalHours = totalHoursRaw + totalMinutes / 60;
  const totalHoursAmount = totalHours * settings.hourlyRate;
  const totalMobility = totalDays * settings.mobilityRate;
  const totalMonth = totalHoursAmount + totalMobility;

  // ── Sync single transaction for the month ──────────────────────────────
  useEffect(() => {
    if (!addTransaction || !deleteTransaction || !transactions) return;

    // Find existing "Empleada Doméstica" transaction for this month
    const existingTx = transactions.find((tx) => {
      if (tx.description !== "Empleada Doméstica") return false;
      const txDate = new Date(tx.created_at);
      return txDate.getUTCFullYear() === year && txDate.getUTCMonth() === month;
    });

    if (totalDays === 0) {
      // No days registered: delete the transaction if it exists
      if (existingTx) {
        deleteTransaction(existingTx.id);
      }
    } else {
      // Days registered: create or update the transaction
      if (existingTx) {
        // Update existing transaction if amount or category changed
        const amountChanged = Math.abs(existingTx.amount - totalMonth) > 0.01;
        const categoryWrong = existingTx.category !== "Empleada Domestica";

        if (amountChanged || categoryWrong) {
          updateTransaction(existingTx.id, {
            amount: totalMonth,
            category: "Empleada Domestica",
            notes: `${totalHoursRaw}h${totalMinutes > 0 ? ` ${totalMinutes}m` : ""} · ${totalDays} ${totalDays === 1 ? "día" : "días"} · movilidad $${settings.mobilityRate}`,
          });
        }
      } else {
        // Create new transaction
        addTransaction({
          description: "Empleada Doméstica",
          amount: totalMonth,
          category: "Empleada Domestica",
          type: "expense",
          notes: `${totalHoursRaw}h${totalMinutes > 0 ? ` ${totalMinutes}m` : ""} · ${totalDays} ${totalDays === 1 ? "día" : "días"} · movilidad $${settings.mobilityRate}`,
          created_at: new Date(
            Date.UTC(year, month, 15, 12, 0, 0),
          ).toISOString(),
        });
      }
    }
  }, [
    monthEntries,
    totalMonth,
    year,
    month,
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    totalHoursRaw,
    totalMinutes,
    totalDays,
    settings.mobilityRate,
  ]);

  // ── Settings card state ────────────────────────────────────────────────────
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    if (!loading && !settings.hourlyRate) setConfigOpen(true);
  }, [loading, settings.hourlyRate]);

  const [draftHourly, setDraftHourly] = useState(settings.hourlyRate);
  const [draftMobility, setDraftMobility] = useState(settings.mobilityRate);

  useEffect(() => {
    if (!loading) {
      setDraftHourly(settings.hourlyRate);
      setDraftMobility(settings.mobilityRate);
    }
  }, [loading, settings.hourlyRate, settings.mobilityRate]);

  function handleSaveSettings() {
    saveSettings({ hourlyRate: draftHourly, mobilityRate: draftMobility });
    setConfigOpen(false);
  }

  // ── Add entry form state ───────────────────────────────────────────────────
  const inCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === month;
  const defaultDate = inCurrentMonth ? todayStr() : `${monthKey}-01`;

  const [newDate, setNewDate] = useState(defaultDate);
  const [newDateDisplay, setNewDateDisplay] = useState(
    dateToDisplay(defaultDate),
  );
  const [newHours, setNewHours] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [addError, setAddError] = useState("");

  function handleAdd() {
    if (!newDate) {
      setAddError("Ingresá una fecha.");
      return;
    }
    const h = Number.parseFloat(String(newHours).replace(",", ".")) || 0;
    const m = Number.parseInt(String(newMinutes)) || 0;
    if (h === 0 && m === 0) {
      setAddError("Ingresá las horas o minutos trabajados.");
      return;
    }
    if (entries.some((e) => e.date === newDate)) {
      setAddError("Ya existe un registro para ese día.");
      return;
    }
    setAddError("");
    addEntry({ date: newDate, hours: h, minutes: m });
    setNewHours("");
    setNewMinutes("");
    const today = todayStr();
    const newDefDate = today.startsWith(monthKey) ? today : `${monthKey}-01`;
    setNewDate(newDefDate);
    setNewDateDisplay(dateToDisplay(newDefDate));
  }

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editHours, setEditHours] = useState("");

  const [editMinutes, setEditMinutes] = useState("");

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditHours(entry.hours);
    setEditMinutes(entry.minutes || 0);
  }

  function confirmEdit(id) {
    const h = Number.parseFloat(String(editHours).replace(",", ".")) || 0;
    const m = Number.parseInt(String(editMinutes)) || 0;
    if (h === 0 && m === 0) return;
    updateEntry(id, { hours: h, minutes: m });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  // ── Monthly summary ────────────────────────────────────────────────────────
  // (moved to after useEffect)

  if (loading) {
    return (
      <div className="space-y-4 pb-8 animate-pulse">
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {housekeeperError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          {housekeeperError.includes("housekeeper_")
            ? "Falta la migración en Supabase. Ejecutá supabase/migrations/005_housekeeper.sql en el SQL Editor."
            : housekeeperError}
        </p>
      )}
      {/* ── Configuración ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => {
            if (!configOpen) {
              setDraftHourly(settings.hourlyRate);
              setDraftMobility(settings.mobilityRate);
            }
            setConfigOpen((v) => !v);
          }}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            Configuración de tarifas
          </span>
          <div className="flex items-center gap-3">
            {!configOpen && settings.hourlyRate > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {fmt.format(settings.hourlyRate)}/h · mov.{" "}
                {fmt.format(settings.mobilityRate)}
              </span>
            )}
            {configOpen ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </div>
        </button>

        {configOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
            <div>
              <label
                htmlFor="hk-hourly"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Precio por hora
              </label>
              <AmountField
                id="hk-hourly"
                value={draftHourly}
                onValueChange={(v) => setDraftHourly(v.floatValue ?? 0)}
                prefix="$ "
                className="focus:ring-violet-400 dark:focus:ring-violet-500"
                placeholder="$ 0"
              />
            </div>
            <div>
              <label
                htmlFor="hk-mobility"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Movilidad por día
              </label>
              <AmountField
                id="hk-mobility"
                value={draftMobility}
                onValueChange={(v) => setDraftMobility(v.floatValue ?? 0)}
                prefix="$ "
                className="focus:ring-violet-400 dark:focus:ring-violet-500"
                placeholder="$ 0"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-xl py-2 text-sm font-semibold transition-colors"
            >
              Guardar tarifas
            </button>
          </div>
        )}
      </div>

      {/* ── Registrar día ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm px-4 py-4 space-y-3">
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          Registrar día trabajado
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="DD/MM/YYYY"
            value={newDateDisplay}
            onChange={(e) => {
              const display = e.target.value;
              setNewDateDisplay(display);
              if (
                display.length === 10 &&
                display[2] === "/" &&
                display[5] === "/"
              ) {
                const internalDate = displayToDate(display);
                if (internalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  setNewDate(internalDate);
                }
              }
              setAddError("");
            }}
            maxLength={10}
            className="flex-1 min-w-[120px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="w-24">
            <AmountField
              value={newHours}
              onValueChange={(v) => {
                setNewHours(v.value);
                setAddError("");
              }}
              thousandSeparator={false}
              decimalSeparator=","
              suffix=" h"
              allowNegative={false}
              decimalScale={1}
              className="w-full focus:ring-violet-400 dark:focus:ring-violet-500"
              placeholder="0 h"
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              min="0"
              max="59"
              placeholder="0 m"
              value={newMinutes}
              onChange={(e) => {
                setNewMinutes(e.target.value);
                setAddError("");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <button
            onClick={handleAdd}
            className="bg-violet-500 hover:bg-violet-600 text-white rounded-xl px-3 py-2 transition-colors flex items-center gap-1 text-sm font-semibold"
          >
            <Plus size={16} />
          </button>
        </div>
        {addError && <p className="text-xs text-gp-danger">{addError}</p>}
        {settings.hourlyRate > 0 &&
          (Number.parseFloat(String(newHours).replace(",", ".")) > 0 ||
            Number.parseInt(String(newMinutes)) > 0) && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pago estimado:{" "}
              <span className="font-semibold text-gp-income-text dark:text-gp-income">
                {fmt.format(
                  dailyPay(
                    Number.parseFloat(String(newHours).replace(",", ".")) || 0,
                    Number.parseInt(String(newMinutes)) || 0,
                    settings,
                  ),
                )}
              </span>{" "}
              ({newHours || "0"}h
              {Number.parseInt(String(newMinutes)) > 0 && ` ${newMinutes}m`} ×{" "}
              {fmt.format(settings.hourlyRate)} +{" "}
              {fmt.format(settings.mobilityRate)} mov.)
            </p>
          )}
      </div>

      {/* ── Lista de días ── */}
      {monthEntries.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {monthEntries.map((entry) => {
              const d = parseLocalDate(entry.date);
              const dayName = DAYS_ES[d.getDay()];
              const dayNum = d.getDate();
              const pay = dailyPay(entry.hours, entry.minutes || 0, settings);
              const isEditing = editingId === entry.id;

              return (
                <div key={entry.id} className="px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-16">
                        {dayName} {dayNum}
                      </span>
                      <AmountField
                        value={editHours}
                        onValueChange={(v) => setEditHours(v.value)}
                        thousandSeparator={false}
                        decimalSeparator=","
                        suffix=" h"
                        allowNegative={false}
                        decimalScale={1}
                        autoFocus
                        className="w-20 border-violet-300 dark:border-violet-500 focus:ring-violet-400 dark:focus:ring-violet-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        className="w-16 rounded-lg border border-violet-300 dark:border-violet-500 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                      <button
                        onClick={() => confirmEdit(entry.id)}
                        className="text-gp-income hover:text-gp-income-hover p-1"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {dayName} {dayNum}
                          </span>
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            {entry.hours}h
                            {entry.minutes > 0 ? ` ${entry.minutes}m` : ""}
                          </span>
                          <span className="text-base font-bold text-gp-income-text dark:text-gp-income">
                            {fmt.format(pay)}
                          </span>
                        </div>
                        {settings.hourlyRate > 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {entry.hours}h
                            {entry.minutes > 0 ? ` ${entry.minutes}m` : ""} ×{" "}
                            {fmt.format(settings.hourlyRate)}
                            {settings.mobilityRate > 0 &&
                              ` + ${fmt.format(settings.mobilityRate)} mov.`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-slate-400 hover:text-violet-500 p-1 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-slate-400 hover:text-gp-danger p-1 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Resumen mensual ── */}
      {monthEntries.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-3">
            Resumen del mes
          </p>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              {totalDays} {totalDays === 1 ? "día" : "días"} · {totalHoursRaw}h
              {totalMinutes > 0 ? ` ${totalMinutes}m` : ""} en total
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Subtotal horas</span>
            <span>{fmt.format(totalHoursAmount)}</span>
          </div>
          {settings.mobilityRate > 0 && (
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>
                Movilidad ({totalDays} {totalDays === 1 ? "día" : "días"})
              </span>
              <span>{fmt.format(totalMobility)}</span>
            </div>
          )}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-2 flex justify-between font-bold text-base">
            <span className="text-slate-700 dark:text-slate-200">
              Total del mes
            </span>
            <span className="text-gp-income-text dark:text-gp-income">
              {fmt.format(totalMonth)}
            </span>
          </div>
        </div>
      )}

      {monthEntries.length === 0 && (
        <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">
          No hay días registrados para este mes.
        </p>
      )}
    </div>
  );
}

export default HousekeeperPage;
