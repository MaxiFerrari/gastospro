import { useState, useRef, useMemo } from "react";
import {
  Trash2,
  Pencil,
  Check,
  X,
  GripVertical,
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
  Search,
  Download,
  ExternalLink,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { parseAmount, formatAmount, stripFormat } from "../lib/amount";

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

function TransactionItem({
  transaction,
  onDelete,
  onUpdate,
  onToggleStatus,
  dragHandleProps,
  isDragging,
  isDraggable,
}) {
  const Icon = CATEGORY_ICONS[transaction.category] ?? HelpCircle;
  const isIncome = transaction.type === "income";
  const isOptimistic = String(transaction.id).startsWith("optimistic-");
  const isPaid = transaction.status === "paid";

  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(transaction.description);
  const [editAmount, setEditAmount] = useState(
    transaction.amount != null ? formatAmount(transaction.amount) : "",
  );
  const [editNotes, setEditNotes] = useState(transaction.notes ?? "");
  const descRef = useRef(null);

  const hasAmount = transaction.amount != null;
  const formatted = hasAmount
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }).format(transaction.amount)
    : null;

  const dateStr = new Date(transaction.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });

  function startEdit() {
    setEditDesc(transaction.description);
    setEditAmount(transaction.amount != null ? formatAmount(transaction.amount) : "");
    setEditNotes(transaction.notes ?? "");
    setEditing(true);
    setTimeout(() => descRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function confirmEdit() {
    if (!editDesc.trim()) return;
    const parsedAmount = editAmount === "" ? null : parseAmount(editAmount);
    if (parsedAmount !== null && parsedAmount <= 0) return;
    setEditing(false);
    const patch = { description: editDesc.trim(), amount: parsedAmount };
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
        <div
          className={`flex-shrink-0 p-2 rounded-xl ${isIncome ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}
        >
          <Icon
            className={`w-4 h-4 ${isIncome ? "text-emerald-500" : "text-red-400"}`}
            strokeWidth={2}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            ref={descRef}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
            maxLength={120}
          />
          <input
            type="text"
            inputMode="decimal"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            onFocus={() => setEditAmount(stripFormat(editAmount))}
            onBlur={() => {
              const n = parseAmount(editAmount);
              if (n != null) setEditAmount(formatAmount(n));
            }}
            placeholder="Sin monto"
            className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
          />
          <input
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Nota (opcional)"
            className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
            maxLength={300}
          />
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={confirmEdit}
            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 py-3.5 px-1 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-opacity ${isOptimistic ? "opacity-60" : "opacity-100"} ${isDragging ? "bg-slate-50 dark:bg-slate-700 shadow-lg rounded-xl" : ""}`}
    >
      {isDraggable && (
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-200 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 touch-none"
        >
          <GripVertical className="w-4 h-4" strokeWidth={2} />
        </div>
      )}
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
          {transaction.description}
        </p>
        <p className="text-xs text-slate-400">
          {transaction.category} · {dateStr}
        </p>
        {transaction.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
            {transaction.notes}
          </p>
        )}
      </div>

      {hasAmount ? (
        <span
          className={`text-sm font-bold flex-shrink-0 ${isIncome ? "text-emerald-600" : "text-red-500"}`}
        >
          {isIncome ? "+" : "-"}
          {formatted}
        </span>
      ) : (
        <span className="text-xs font-semibold text-slate-300 dark:text-slate-600 flex-shrink-0 italic">
          Sin monto
        </span>
      )}

      {/* Payment status toggle */}
      <button
        onClick={() => onToggleStatus(transaction.id)}
        disabled={isOptimistic}
        aria-label={isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
        className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors disabled:pointer-events-none ${
          isPaid
            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900"
            : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
        }`}
      >
        {isPaid ? (
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
        ) : (
          <Clock className="w-3 h-3" strokeWidth={2.5} />
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
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Ver comprobante"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2} />
        </a>
      )}

      <button
        onClick={startEdit}
        disabled={isOptimistic}
        aria-label="Editar"
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:pointer-events-none"
      >
        <Pencil className="w-4 h-4" strokeWidth={2} />
      </button>

      <button
        onClick={() => onDelete(transaction.id)}
        disabled={isOptimistic}
        aria-label="Eliminar"
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:pointer-events-none"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function SortableTransactionItem({
  transaction,
  onDelete,
  onUpdate,
  onToggleStatus,
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
    <div ref={setNodeRef} style={style}>
      <TransactionItem
        transaction={transaction}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onToggleStatus={onToggleStatus}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        isDraggable={true}
      />
    </div>
  );
}

export default function TransactionList({
  transactions,
  onDelete,
  onUpdate,
  onToggleStatus,
  onReorder,
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions],
  );

  const isFiltered =
    search.trim() !== "" || filterType !== "all" || filterCategory !== "all";

  const filtered = useMemo(() => {
    if (!isFiltered) return transactions;
    return transactions.filter((t) => {
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
  }, [transactions, search, filterType, filterCategory, isFiltered]);

  function downloadCSV() {
    const rows = [
      ["Fecha", "Descripción", "Tipo", "Categoría", "Monto", "Notas"],
      ...filtered.map((t) => [
        new Date(t.created_at).toLocaleDateString("es-AR"),
        `"${(t.description ?? "").replace(/"/g, '""')}"`,
        t.type === "income" ? "Ingreso" : "Egreso",
        t.category ?? "",
        t.amount ?? "",
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

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = transactions.findIndex((t) => t.id === active.id);
    const newIndex = transactions.findIndex((t) => t.id === over.id);
    onReorder(arrayMove(transactions, oldIndex, newIndex));
  }

  if (transactions.length === 0) {
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Movimientos
          </h2>
          <div className="flex items-center gap-1">
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

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-400">Sin resultados.</p>
        </div>
      ) : isFiltered ? (
        <div className="px-4 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-300px)]">
          {filtered.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onDelete={onDelete}
              onUpdate={onUpdate}
              dragHandleProps={{}}
              isDragging={false}
              isDraggable={false}
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={transactions.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="px-4 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-300px)]">
              {transactions.map((t) => (
                <SortableTransactionItem
                  key={t.id}
                  transaction={t}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onToggleStatus={onToggleStatus}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
