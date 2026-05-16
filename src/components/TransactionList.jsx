import { useState, useRef, useMemo, useEffect } from "react";
import {
  Trash2,
  Pencil,
  Check,
  X,
  GripVertical,
  Search,
  Download,
  ExternalLink,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  ListChecks,
  ChevronDown,
  MoreVertical,
  Copy,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getIconOption } from "../lib/subscriptionIcons";
import CategoryIconBadge from "./CategoryIconBadge";
import NumericInput from "./NumericInput";
import { useOutsideClick } from "../hooks/useOutsideClick";

function TransactionItem({
  transaction,
  onDelete,
  onUpdate,
  onToggleStatus,
  onDuplicate,
  dragHandleProps,
  isDragging,
  isDraggable,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
}) {
  const isIncome = transaction.type === "income";
  const isOptimistic = String(transaction.id).startsWith("optimistic-");
  const isPaid = transaction.status === "paid";

  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(transaction.description);
  const [editAmount, setEditAmount] = useState(transaction.amount ?? "");
  const [editNotes, setEditNotes] = useState(transaction.notes ?? "");
  const [editExcludeFromTotals, setEditExcludeFromTotals] = useState(
    transaction.exclude_from_totals === true,
  );
  const descRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  const hasAmount = transaction.amount != null;
  const formatted = hasAmount
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(transaction.amount)
    : null;

  const _d = new Date(transaction.created_at);
  const MONTHS = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const dateStr = `${_d.getDate()} ${MONTHS[_d.getMonth()]}`;

  useEffect(() => {
    if (!editing) {
      setEditDesc(transaction.description);
      setEditAmount(transaction.amount ?? "");
      setEditNotes(transaction.notes ?? "");
      setEditExcludeFromTotals(transaction.exclude_from_totals === true);
    }
  }, [transaction, editing]);

  function startEdit() {
    setEditDesc(transaction.description);
    setEditAmount(transaction.amount ?? "");
    setEditNotes(transaction.notes ?? "");
    setEditExcludeFromTotals(transaction.exclude_from_totals === true);
    setEditing(true);
    setTimeout(() => descRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function confirmEdit() {
    if (!editDesc.trim()) return;
    const parsedAmount = editAmount === "" ? null : editAmount;
    if (parsedAmount !== null && parsedAmount <= 0) return;
    setEditing(false);
    const patch = { description: editDesc.trim(), amount: parsedAmount };
    patch.exclude_from_totals = !isIncome && editExcludeFromTotals;
    // Only include notes if it changed (requires notes column in DB)
    if (editNotes !== (transaction.notes ?? "")) {
      patch.notes = editNotes.trim() || null;
    }
    await onUpdate(transaction.id, patch);
  }

  if (editing) {
    return (
      <div className="flex items-start gap-2 py-3 px-1 border-b border-slate-100 dark:border-slate-700">
        {isDraggable && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 mt-1 cursor-grab text-slate-200 hover:text-slate-400 touch-none"
          >
            <GripVertical className="w-4 h-4" strokeWidth={2} />
          </div>
        )}
        <CategoryIconBadge
          category={transaction.category}
          isIncome={isIncome}
        />
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            ref={descRef}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
            maxLength={120}
          />
          <NumericInput
            value={editAmount}
            onValueChange={({ floatValue }) => setEditAmount(floatValue ?? "")}
            placeholder="Sin monto"
            className="text-sm rounded-lg px-2 py-1 w-full"
          />
          <input
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Nota (opcional)"
            className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
            maxLength={300}
          />
          {!isIncome && (
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editExcludeFromTotals}
                onChange={(e) => setEditExcludeFromTotals(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              Compra con tarjeta — no sumar al mes
            </label>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={confirmEdit}
            className="p-2 sm:p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            <Check className="w-5 sm:w-4 h-5 sm:h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={cancelEdit}
            className="p-2 sm:p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 sm:w-4 h-5 sm:h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={selectMode ? () => onToggleSelect?.(transaction.id) : undefined}
      className={`group flex items-center gap-2 py-2.5 px-1 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-opacity ${isOptimistic ? "opacity-60" : "opacity-100"} ${isDragging ? "bg-slate-50 dark:bg-slate-700 shadow-lg rounded-xl" : ""} ${selectMode ? "cursor-pointer select-none" : ""} ${isSelected ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
    >
      {selectMode && (
        <div className="flex-shrink-0">
          {isSelected ? (
            <CheckCircle2
              className="w-5 h-5 text-emerald-500"
              strokeWidth={2.5}
            />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-500" />
          )}
        </div>
      )}
      {isDraggable && !selectMode && (
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-200 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 touch-none"
        >
          <GripVertical className="w-4 h-4" strokeWidth={2} />
        </div>
      )}
      <CategoryIconBadge category={transaction.category} isIncome={isIncome} />

      <div
        className={`flex-1 min-w-0 ${selectMode ? "" : "cursor-pointer sm:cursor-default"}`}
        onClick={selectMode ? undefined : startEdit}
      >
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {transaction.category} ·{" "}
          <span className="whitespace-nowrap">{dateStr}</span>
          {transaction.installment_id && (
            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 font-medium text-xs leading-none">
              {transaction.installment_index}/{transaction.installment_total}
            </span>
          )}
          {!isIncome && transaction.exclude_from_totals && (
            <span
              className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 font-medium text-xs leading-none"
              title="No suma al resumen del mes (tarjeta)"
            >
              TC
            </span>
          )}
        </p>
        {transaction.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
            {transaction.notes}
          </p>
        )}
      </div>

      {hasAmount ? (
        <span
          className={`text-sm font-bold flex-shrink-0 ${
            isIncome
              ? "text-emerald-600"
              : transaction.exclude_from_totals
                ? "text-sky-600 dark:text-sky-400"
                : "text-red-400"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatted}
        </span>
      ) : (
        <span className="text-xs font-semibold text-slate-300 dark:text-slate-600 flex-shrink-0 italic">
          Sin monto
        </span>
      )}

      {!selectMode && (
        <>
          {/* Payment status toggle */}
          <button
            onClick={() => onToggleStatus(transaction.id)}
            disabled={isOptimistic}
            aria-label={isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 sm:px-2 py-1.5 sm:py-0.5 rounded-full text-xs font-semibold transition-colors disabled:pointer-events-none min-h-[44px] sm:min-h-auto justify-center sm:justify-start ${
              isPaid
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900"
                : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            ) : (
              <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            <span className="hidden sm:inline">
              {isPaid ? "Pagado" : "Pendiente"}
            </span>
          </button>

          {transaction.receipt_url && (
            <a
              href={transaction.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 sm:p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Ver comprobante"
            >
              <ExternalLink className="w-5 sm:w-4 h-5 sm:h-4" strokeWidth={2} />
            </a>
          )}

          {/* Three-dot menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              disabled={isOptimistic}
              aria-label="Acciones"
              className="p-2 sm:p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:pointer-events-none"
            >
              <MoreVertical className="w-5 sm:w-4 h-5 sm:h-4" strokeWidth={2} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    startEdit();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate?.(transaction);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                  Duplicar
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(transaction.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SortableTransactionItem({
  transaction,
  onDelete,
  onUpdate,
  onToggleStatus,
  onDuplicate,
  selectMode,
  isSelected,
  onToggleSelect,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: transaction.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-0" : ""}
    >
      <TransactionItem
        transaction={transaction}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onToggleStatus={onToggleStatus}
        onDuplicate={onDuplicate}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={false}
        isDraggable={true}
        selectMode={selectMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
      />
    </div>
  );
}

export default function TransactionList({
  transactions,
  subscriptions = [],
  exchangeRate = 1200,
  year,
  month,
  onDelete,
  onUpdate,
  onToggleStatus,
  onDuplicate,
  onReorder,
  onDeleteMultiple,
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [subsCollapsed, setSubsCollapsed] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter subscriptions: only show from the month they started
  const visibleSubscriptions = subscriptions.filter((sub) => {
    if (!sub.start_date) return true;
    const start = new Date(sub.start_date + "T00:00:00");
    const startYear = start.getFullYear();
    const startMonth = start.getMonth(); // 0-indexed
    if (year == null || month == null) return true;
    return year > startYear || (year === startYear && month >= startMonth);
  });

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  // Local ordered list — updates immediately on drag without waiting for parent state
  const [orderedItems, setOrderedItems] = useState(transactions);
  useEffect(() => {
    setOrderedItems(transactions);
  }, [transactions]);

  const activeTransaction = activeId
    ? (orderedItems.find((t) => t.id === activeId) ?? null)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const categories = useMemo(
    () => [...new Set(orderedItems.map((t) => t.category))].sort(),
    [orderedItems],
  );

  const isFiltered =
    search.trim() !== "" || filterType !== "all" || filterCategory !== "all";

  const filtered = useMemo(() => {
    if (!isFiltered) return orderedItems;
    return orderedItems.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      if (
        search.trim() &&
        !t.description.toLowerCase().includes(search.trim().toLowerCase()) &&
        !(t.notes ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
        return false;
      return true;
    });
  }, [orderedItems, search, filterType, filterCategory, isFiltered]);

  function downloadCSV() {
    const rows = [
      [
        "Fecha",
        "Descripción",
        "Tipo",
        "Categoría",
        "Monto",
        "En totales",
        "Notas",
      ],
      ...filtered.map((t) => [
        new Date(t.created_at).toLocaleDateString("es-AR"),
        `"${(t.description ?? "").replace(/"/g, '""')}"`,
        t.type === "income" ? "Ingreso" : "Egreso",
        t.category ?? "",
        t.amount ?? "",
        t.exclude_from_totals ? "No" : "Sí",
        `"${(t.notes ?? "").replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movimientos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedItems.findIndex((t) => t.id === active.id);
    const newIndex = orderedItems.findIndex((t) => t.id === over.id);
    const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(newOrder); // immediate visual update
    onReorder(newOrder); // sync sort_order to parent/DB
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  if (transactions.length === 0 && visibleSubscriptions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm text-center">
        <p className="text-slate-400 text-sm">
          No hay movimientos en este período.
        </p>
        <p className="text-slate-300 text-xs mt-1">
          Agregá tu primer ingreso o gasto.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-visible">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        {selectMode ? (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={() => {
                    const ids = [...selectedIds];
                    exitSelectMode();
                    onDeleteMultiple?.(ids);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Eliminar {selectedIds.size}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
              Movimientos
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSelectMode(true);
                  setSelectedIds(new Set());
                }}
                aria-label="Seleccionar"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ListChecks className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                onClick={() => setShowFilters((s) => !s)}
                aria-label="Filtros"
                className={`p-1.5 rounded-lg transition-colors ${
                  isFiltered
                    ? "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700"
                    : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                onClick={downloadCSV}
                aria-label="Exportar CSV"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Search + filters */}
        {showFilters && (
          <div className="space-y-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-slate-500"
                strokeWidth={2}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descripción o nota…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Type filter */}
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 text-xs">
                {["all", "income", "expense"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 font-medium transition-colors ${
                      filterType === t
                        ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t === "all"
                      ? "Todos"
                      : t === "income"
                        ? "↑ Ingresos"
                        : "↓ Egresos"}
                  </button>
                ))}
              </div>
              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">Categoría</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {isFiltered && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterType("all");
                    setFilterCategory("all");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subscriptions for this month */}
      {visibleSubscriptions.length > 0 && (
        <div className="px-4 pt-3 pb-1 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setSubsCollapsed((s) => !s)}
            className="flex items-center gap-1.5 mb-1.5 w-full group"
          >
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Suscripciones
            </p>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${subsCollapsed ? "-rotate-90" : ""}`}
              strokeWidth={2.5}
            />
            {subsCollapsed && (
              <span className="ml-auto text-xs font-semibold text-red-400">
                −
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 0,
                }).format(
                  visibleSubscriptions.reduce((acc, s) => {
                    const monthly =
                      s.billing_cycle === "annual" ? s.amount / 12 : s.amount;
                    return (
                      acc +
                      (s.currency === "USD" ? monthly * exchangeRate : monthly)
                    );
                  }, 0),
                )}
              </span>
            )}
          </button>
          {!subsCollapsed &&
            visibleSubscriptions.map((sub) => {
              const { Icon, color } = getIconOption(sub.emoji);
              const fmtd = new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: sub.currency,
                minimumFractionDigits: 2,
              }).format(sub.amount);

              let billingLabel = null;
              if (sub.billing_cycle === "monthly") {
                billingLabel = sub.billing_day
                  ? `día ${sub.billing_day}`
                  : null;
              } else if (sub.start_date) {
                const start = new Date(sub.start_date + "T00:00:00");
                const now = new Date();
                const renewal = new Date(start);
                renewal.setFullYear(now.getFullYear());
                if (renewal < now) renewal.setFullYear(now.getFullYear() + 1);
                billingLabel = `Renueva ${renewal.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}`;
              } else {
                billingLabel = "anual";
              }

              return (
                <div key={sub.id} className="flex items-center gap-3 py-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                      {sub.name}
                    </p>
                    {billingLabel && (
                      <p className="text-xs text-slate-400">{billingLabel}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-400">
                      −{fmtd}
                    </p>
                    {sub.currency === "USD" && exchangeRate > 1 && (
                      <p className="text-[11px] text-slate-400">
                        ≈{" "}
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }).format(
                          sub.billing_cycle === "annual"
                            ? (sub.amount / 12) * exchangeRate
                            : sub.amount * exchangeRate,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-slate-400">
            No hay movimientos en este período.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-400">Sin resultados.</p>
        </div>
      ) : isFiltered || selectMode ? (
        <div className="px-4">
          {(isFiltered ? filtered : orderedItems).map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onToggleStatus={onToggleStatus}
              onDuplicate={onDuplicate}
              dragHandleProps={{}}
              isDragging={false}
              isDraggable={false}
              selectMode={selectMode}
              isSelected={selectedIds.has(t.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={orderedItems.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="px-4">
              {orderedItems.map((t) => (
                <SortableTransactionItem
                  key={t.id}
                  transaction={t}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onToggleStatus={onToggleStatus}
                  onDuplicate={onDuplicate}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeTransaction ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 px-1 opacity-95">
                <TransactionItem
                  transaction={activeTransaction}
                  onDelete={() => {}}
                  onUpdate={() => {}}
                  onToggleStatus={() => {}}
                  onDuplicate={() => {}}
                  dragHandleProps={{}}
                  isDragging={true}
                  isDraggable={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
