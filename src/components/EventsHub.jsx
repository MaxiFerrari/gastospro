import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Baby,
  Cake,
  Calendar,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { inputControlClass } from "../lib/formFieldStyles";
import { useEvents } from "../hooks/useEvents";
import { useEventGuests } from "../hooks/useEventGuests";
import { useEventExpenses } from "../hooks/useEventExpenses";
import { formatCurrency } from "../lib/amount";
import TextField from "./ui/TextField";
import TextAreaField from "./ui/TextAreaField";
import SelectField from "./ui/SelectField";
import AmountField from "./ui/AmountField";
import GoogleCalendarPanel from "./GoogleCalendarPanel";

const RSVP_LABEL = {
  pending: "Pendiente",
  yes: "Sí",
  no: "No",
};

const RSVP_PILLS = [
  {
    value: "yes",
    label: "Sí",
    active: "bg-gp-income text-white z-[1]",
    idle:
      "text-gp-income-text hover:bg-gp-income-surface dark:hover:bg-gp-income-surface-dark",
  },
  {
    value: "no",
    label: "No",
    active: "bg-gp-expense text-white z-[1]",
    idle:
      "text-gp-expense-text hover:bg-gp-expense-surface dark:hover:bg-gp-expense-surface-dark",
  },
  {
    value: "pending",
    label: "?",
    active: "bg-slate-500 text-white z-[1]",
    idle: "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700",
  },
];

/** Invitados viejos con rsvp "maybe" se muestran como pendiente (?). */
function normalizeRsvp(rsvp) {
  return rsvp === "maybe" ? "pending" : rsvp;
}

function guestAgeGroup(g) {
  return g.age_group === "child" ? "child" : "adult";
}

function splitGuestsByAge(guests) {
  const adults = [];
  const children = [];
  for (const g of guests ?? []) {
    if (guestAgeGroup(g) === "child") children.push(g);
    else adults.push(g);
  }
  return { adults, children };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function RsvpPills({ value, onChange }) {
  const display = normalizeRsvp(value);
  return (
    <div
      role="group"
      aria-label="Asistencia"
      className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0"
    >
      {RSVP_PILLS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={RSVP_LABEL[opt.value]}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-2 text-xs font-semibold transition-colors min-w-[2.5rem] sm:min-w-[2.75rem] ${
            display === opt.value ? opt.active : opt.idle
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function GuestRow({ guest, onRsvp, onDelete }) {
  return (
    <li className="flex items-center gap-2 py-1.5 border-b border-slate-50 dark:border-slate-700/60 last:border-0">
      <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
        {guest.name}
      </span>
      <RsvpPills value={guest.rsvp} onChange={(rsvp) => onRsvp(guest.id, rsvp)} />
      <button
        type="button"
        onClick={() => onDelete(guest.id)}
        className="p-1.5 rounded-lg text-slate-300 hover:text-gp-expense-text hover:bg-gp-expense-surface dark:hover:bg-gp-expense-surface-dark shrink-0"
        aria-label={`Quitar a ${guest.name}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function GuestColumn({
  title,
  icon: Icon,
  guests,
  inputValue,
  onInputChange,
  onAdd,
  placeholder,
  onRsvp,
  onDelete,
}) {
  const yesCount = guests.filter((g) => g.rsvp === "yes").length;

  return (
    <div className="min-w-0 flex flex-col rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={2} />
          {title}
        </p>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
          {yesCount}/{guests.length} confirman
        </span>
      </div>
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          maxLength={80}
          className={`${inputControlClass} py-2 text-sm flex-1 min-w-0`}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className="shrink-0 p-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 disabled:opacity-40 transition-opacity"
          aria-label={`Agregar ${title.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
      {guests.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 py-1">
          Escribí un nombre y Enter
        </p>
      ) : (
        <ul className="space-y-0 max-h-56 overflow-y-auto overscroll-contain -mx-0.5 px-0.5">
          {guests.map((g) => (
            <GuestRow
              key={g.id}
              guest={g}
              onRsvp={onRsvp}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EventCard({ event, guests, expenseCount, expenseTotal, onOpen }) {
  const { adults, children } = splitGuestsByAge(guests);
  const confirmed = (guests ?? []).filter((g) => g.rsvp === "yes").length;
  const totalG = (guests ?? []).length;
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50">
          <Cake className="w-5 h-5 text-rose-500" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {event.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {fmtDate(event.event_date)}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3.5 h-3.5" />
              {confirmed}/{totalG || 0} confirman
              {totalG > 0 && (
                <span className="text-slate-400">
                  {" "}
                  · {adults.length} adultos
                  {children.length > 0 && ` · ${children.length} niños`}
                </span>
              )}
            </span>
            {expenseCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-gp-income dark:text-gp-income-text">
                <Wallet className="w-3.5 h-3.5" />
                {formatCurrency(expenseTotal, 0)} · {expenseCount} gasto
                {expenseCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function EventForm({ initial, onSave, onCancel, saving, error }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [eventDate, setEventDate] = useState(initial?.event_date ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "birthday");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!eventDate) return;
    await onSave({
      title: title.trim(),
      event_date: eventDate,
      kind,
      notes: notes.trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-lg mx-auto dark:[color-scheme:dark]"
    >
      <TextField
        label="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej. Cumple de Ana"
        maxLength={120}
      />
      <TextField
        label="Fecha del evento"
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />
      <SelectField label="Tipo" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="birthday">Cumpleaños</option>
        <option value="other">Otro</option>
      </SelectField>
      <TextAreaField
        label="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={500}
      />
      {error && <p className="text-xs text-gp-danger font-medium">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !eventDate}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default function EventsHub({ userId }) {
  const {
    events,
    loading,
    error: eventsError,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useEvents(userId);

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const { guestsByEventId, addGuest, updateGuest, deleteGuest } =
    useEventGuests(eventIds);
  const { expensesByEventId, addExpense, deleteExpense } =
    useEventExpenses(eventIds);

  const expenseAgg = useMemo(() => {
    const map = {};
    for (const id of eventIds) {
      const list = expensesByEventId[id] ?? [];
      map[id] = {
        count: list.length,
        total: list.reduce((s, e) => s + Number(e.amount ?? 0), 0),
      };
    }
    return map;
  }, [eventIds, expensesByEventId]);

  const [mode, setMode] = useState("list");
  const [editingEvent, setEditingEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [guestAdultName, setGuestAdultName] = useState("");
  const [guestChildName, setGuestChildName] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expNotes, setExpNotes] = useState("");
  const [expError, setExpError] = useState(null);

  async function handleSaveEvent(payload) {
    setFormError(null);
    setFormSaving(true);
    let r;
    if (editingEvent?.id) {
      r = await updateEvent(editingEvent.id, payload);
    } else {
      r = await addEvent(payload);
    }
    setFormSaving(false);
    if (r?.error) {
      setFormError(r.error);
      return;
    }
    if (editingEvent?.id) {
      setDetailEvent((d) =>
        d?.id === editingEvent.id ? { ...d, ...payload } : d,
      );
      setMode("detail");
      setEditingEvent(null);
    } else {
      setMode("list");
      setEditingEvent(null);
    }
  }

  function openNew() {
    setEditingEvent(null);
    setFormError(null);
    setMode("form");
  }

  function openEdit(ev) {
    setEditingEvent(ev);
    setFormError(null);
    setMode("form");
  }

  function openDetail(ev) {
    setDetailEvent(ev);
    setMode("detail");
    setGuestAdultName("");
    setGuestChildName("");
    setExpDesc("");
    setExpAmount("");
    setExpNotes("");
    setExpError(null);
  }

  async function handleAddGuest(ageGroup) {
    if (!detailEvent) return;
    const name =
      ageGroup === "child" ? guestChildName.trim() : guestAdultName.trim();
    if (!name) return;
    const r = await addGuest(detailEvent.id, { name, age_group: ageGroup });
    if (!r?.error) {
      if (ageGroup === "child") setGuestChildName("");
      else setGuestAdultName("");
    }
  }

  async function handleAddEventExpense() {
    if (!detailEvent) return;
    setExpError(null);
    const desc = expDesc.trim();
    const amt =
      expAmount === "" || expAmount == null
        ? NaN
        : Number(expAmount);
    if (!desc) {
      setExpError("Agregá una descripción.");
      return;
    }
    if (Number.isNaN(amt) || amt < 0) {
      setExpError("Monto inválido.");
      return;
    }
    const r = await addExpense(detailEvent.id, {
      description: desc,
      amount: Math.round(amt * 100) / 100,
      notes: expNotes.trim() || null,
    });
    if (r?.error) {
      setExpError(r.error);
      return;
    }
    setExpDesc("");
    setExpAmount("");
    setExpNotes("");
  }

  if (eventsError && events.length === 0 && !loading) {
    return (
      <div className="rounded-2xl bg-gp-pending-surface dark:bg-gp-pending-surface-dark/40 border border-gp-pending/40 dark:border-gp-pending/30 p-5 text-sm text-gp-pending-text dark:text-gp-pending">
        <p className="font-medium">No se pudieron cargar los eventos.</p>
        <p className="text-xs mt-1 opacity-90">{eventsError}</p>
        <p className="text-xs mt-2">
          Ejecutá las migraciones en Supabase:{" "}
          <code className="bg-gp-pending-surface dark:bg-gp-pending-surface-dark px-1 rounded">
            supabase/migrations/001_events_module.sql
          </code>{" "}
          y{" "}
          <code className="bg-gp-pending-surface dark:bg-gp-pending-surface-dark px-1 rounded">
            002_event_expenses.sql
          </code>{" "}
          y{" "}
          <code className="bg-gp-pending-surface dark:bg-gp-pending-surface-dark px-1 rounded">
            003_event_guest_age_group.sql
          </code>
        </p>
      </div>
    );
  }

  if (mode === "form") {
    return (
      <div className="max-w-2xl mx-auto dark:[color-scheme:dark]">
        <button
          type="button"
          onClick={() => {
            setMode(editingEvent ? "detail" : "list");
            if (!editingEvent) setEditingEvent(null);
          }}
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          {editingEvent ? "Editar evento" : "Nuevo cumple / evento"}
        </h2>
        <EventForm
          key={editingEvent?.id ?? "new"}
          initial={editingEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setMode(editingEvent ? "detail" : "list");
          }}
          saving={formSaving}
          error={formError}
        />
      </div>
    );
  }

  if (mode === "detail" && detailEvent) {
    const guests = guestsByEventId[detailEvent.id] ?? [];
    const { adults, children } = splitGuestsByAge(guests);
    const detailExpenses = expensesByEventId[detailEvent.id] ?? [];
    return (
      <div className="max-w-2xl mx-auto dark:[color-scheme:dark]">
        <button
          type="button"
          onClick={() => {
            setDetailEvent(null);
            setMode("list");
          }}
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Todas las tarjetas
        </button>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mb-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {detailEvent.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {fmtDate(detailEvent.event_date)} ·{" "}
                {detailEvent.kind === "birthday" ? "Cumpleaños" : "Otro"}
              </p>
              {detailEvent.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  {detailEvent.notes}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => openEdit(detailEvent)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invitados
            </h3>
            {guests.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {guests.filter((g) => g.rsvp === "yes").length} confirman ·{" "}
                {adults.length} adultos
                {children.length > 0 && ` · ${children.length} niños`}
              </p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
            Dos columnas: agregá con Enter. Tocá Sí / No / ? para la asistencia.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GuestColumn
              title="Adultos"
              icon={User}
              guests={adults}
              inputValue={guestAdultName}
              onInputChange={setGuestAdultName}
              onAdd={() => handleAddGuest("adult")}
              placeholder="Nombre adulto"
              onRsvp={(id, rsvp) =>
                updateGuest(detailEvent.id, id, { rsvp })
              }
              onDelete={(id) => deleteGuest(detailEvent.id, id)}
            />
            <GuestColumn
              title="Niños"
              icon={Baby}
              guests={children}
              inputValue={guestChildName}
              onInputChange={setGuestChildName}
              onAdd={() => handleAddGuest("child")}
              placeholder="Nombre niño/a"
              onRsvp={(id, rsvp) =>
                updateGuest(detailEvent.id, id, { rsvp })
              }
              onDelete={(id) => deleteGuest(detailEvent.id, id)}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Gastos del festejo
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
            Solo para este evento; no aparecen en Gastos-Pro ni en movimientos
            mensuales.
          </p>
          <div className="space-y-2 mb-4">
            <TextField
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="Descripción (ej. torta, decoración)"
              maxLength={120}
            />
            <div className="flex gap-2 flex-wrap sm:flex-nowrap items-start">
              <AmountField
                value={expAmount}
                onValueChange={({ floatValue }) =>
                  setExpAmount(floatValue ?? "")
                }
                placeholder="Monto"
                inputMode="decimal"
                className="w-full sm:w-32 shrink-0 tabular-nums"
              />
              <TextField
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
                placeholder="Nota (opcional)"
                className="flex-1 min-w-0"
                maxLength={200}
              />
            </div>
            {expError && (
              <p className="text-xs text-gp-danger font-medium">{expError}</p>
            )}
            <button
              type="button"
              onClick={handleAddEventExpense}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gp-income hover:bg-gp-income-hover text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Agregar gasto
            </button>
          </div>
          {detailExpenses.length === 0 ? (
            <p className="text-xs text-slate-400">Todavía no cargaste gastos.</p>
          ) : (
            <ul className="space-y-2">
              {detailExpenses.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-start justify-between gap-2 text-sm border-b border-slate-50 dark:border-slate-700/80 pb-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                      {ex.description}
                    </p>
                    {ex.notes && (
                      <p className="text-xs text-slate-400 mt-0.5">{ex.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-gp-expense-text font-semibold tabular-nums text-xs">
                      {formatCurrency(ex.amount, 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteExpense(detailEvent.id, ex.id)}
                      className="p-1 text-slate-300 hover:text-gp-expense-text"
                      aria-label="Eliminar gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              if (
                !detailEvent ||
                !window.confirm(
                  "¿Eliminar este evento? Se borrarán invitados y gastos del festejo.",
                )
              )
                return;
              await deleteEvent(detailEvent.id);
              setDetailEvent(null);
              setMode("list");
            }}
            className="text-xs text-gp-expense-text hover:text-gp-expense-hover"
          >
            Eliminar evento…
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto dark:[color-scheme:dark]">
      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Organizá cumpleaños, invitados y gastos del festejo (aparte de tus
          movimientos).
        </p>
        <button
          type="button"
          onClick={openNew}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo evento
        </button>
      </div>

      <div className="mb-6">
        <GoogleCalendarPanel userId={userId} variant="hub" />
      </div>

      {loading && events.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 p-10 text-center">
          <Cake className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Todavía no hay eventos guardados.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100 underline"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              guests={guestsByEventId[ev.id]}
              expenseCount={expenseAgg[ev.id]?.count ?? 0}
              expenseTotal={expenseAgg[ev.id]?.total ?? 0}
              onOpen={openDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
