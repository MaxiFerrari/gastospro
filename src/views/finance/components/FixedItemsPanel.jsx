import { useState, useEffect } from "react";
import { formatAmount } from "@lib/amount";
import { CATEGORIES } from "@lib/categoryIcons";
import CategoryIconBadge from "@views/shared/CategoryIconBadge";
import AmountField from "@components/ui/AmountField";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
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

// A single pending fixed item row with inline amount entry
function PendingFixedItem({
  item,
  onFill,
  prevMonthAmount,
  dragHandleProps = {},
}) {
  const isIncome = item.type === "income";
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFill() {
    if (amount === "") return;
    // Snapshot next input BEFORE this item unmounts
    const allInputs = [
      ...document.querySelectorAll("input[data-pending-input]"),
    ];
    const idx = allInputs.findIndex(
      (el) => el.dataset.pendingInput === String(item.id),
    );
    const nextInput = idx >= 0 ? allInputs[idx + 1] ?? null : null;
    setSaving(true);
    await onFill(item, amount);
    setSaving(false);
    setAmount("");
    if (nextInput) setTimeout(() => nextInput.focus(), 0);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      {/* Row 1: grip + icon + description */}
      <div
        {...dragHandleProps}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 text-slate-300 dark:text-slate-600 touch-none"
      >
        <GripVertical className="w-4 h-4" strokeWidth={2} />
      </div>
      <CategoryIconBadge category={item.category} isIncome={isIncome} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {item.description}
        </p>
        <p className="text-xs text-slate-400">{item.category}</p>
      </div>
      {/* Row 2 on mobile / inline on sm+: amount input + confirm */}
      <div className="flex items-center gap-2 w-full sm:w-auto pl-8 sm:pl-0 mt-1.5 sm:mt-0">
        <div className="flex flex-col flex-1 sm:flex-none items-stretch sm:items-end gap-1">
          <AmountField
            compact
            value={amount}
            onValueChange={({ floatValue }) => setAmount(floatValue ?? "")}
            onKeyDown={(e) => e.key === "Enter" && handleFill()}
            placeholder="Monto"
            data-pending-input={item.id}
            className="w-full sm:w-40 text-base"
          />
          {prevMonthAmount != null && (
            <button
              type="button"
              onClick={() => setAmount(prevMonthAmount)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <Copy className="w-3 h-3" strokeWidth={2} />
              {formatAmount(prevMonthAmount)}
            </button>
          )}
        </div>
        <button
          onClick={handleFill}
          disabled={saving || amount === ""}
          className="flex-shrink-0 self-start p-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Confirmar monto"
        >
          <Check className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function SortablePendingFixedItem({ item, onFill, prevMonthAmount }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
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
      <PendingFixedItem
        item={item}
        onFill={onFill}
        prevMonthAmount={prevMonthAmount}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Management row: shows existing fixed item with edit/delete options
function FixedItemRow({ item, onDelete, onUpdate, dragHandleProps = {} }) {
  const isIncome = item.type === "income";
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editType, setEditType] = useState(item.type);
  const [editCat, setEditCat] = useState(item.category);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!editDesc.trim()) return;
    setSaving(true);
    await onUpdate(item.id, {
      description: editDesc.trim(),
      type: editType,
      category: editCat,
    });
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setEditDesc(item.description);
    setEditType(item.type);
    setEditCat(item.category);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 space-y-2">
        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
          {["expense", "income"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setEditType(t);
                setEditCat(CATEGORIES[t][0]);
              }}
              className={`flex-1 py-1 text-xs font-semibold transition-colors ${
                editType === t
                  ? t === "income"
                    ? "bg-gp-income text-white"
                    : "bg-gp-expense text-white"
                  : "bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {t === "income" ? "↑ Ingreso" : "↓ Egreso"}
            </button>
          ))}
        </div>
        <input
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          maxLength={120}
          autoFocus
          className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        />
        <select
          value={editCat}
          onChange={(e) => setEditCat(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        >
          {CATEGORIES[editType].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !editDesc.trim()}
            className="flex-1 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Guardar
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-opacity ${
        item.active === false ? "opacity-40" : ""
      }`}
    >
      <div
        {...dragHandleProps}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 text-slate-300 dark:text-slate-600 touch-none"
      >
        <GripVertical className="w-4 h-4" strokeWidth={2} />
      </div>
      <CategoryIconBadge
        category={item.category}
        isIncome={isIncome}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {item.description}
        </p>
        <p className="text-xs text-slate-400">{item.category}</p>
      </div>
      {/* Active toggle switch */}
      <button
        type="button"
        onClick={() => onUpdate(item.id, { active: item.active === false })}
        className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          item.active !== false
            ? "bg-gp-income"
            : "bg-slate-200 dark:bg-slate-600"
        }`}
        aria-label={item.active !== false ? "Desactivar" : "Activar"}
        title={item.active !== false ? "Desactivar" : "Activar"}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            item.active !== false ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <button
        onClick={() => setEditing(true)}
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Editar fijo"
      >
        <Pencil className="w-4 h-4" strokeWidth={2} />
      </button>
      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-gp-expense-text hover:bg-gp-expense-surface dark:hover:bg-gp-expense-surface-dark transition-colors"
        aria-label="Eliminar fijo"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function SortableFixedItemRow({ item, onDelete, onUpdate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
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
      <FixedItemRow
        item={item}
        onDelete={onDelete}
        onUpdate={onUpdate}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Add fixed item mini-form
function AddFixedItemForm({ onAdd, customCategories = [], onAddCategory }) {
  const [form, setForm] = useState({
    description: "",
    type: "expense",
    category: "Alimentación",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

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

  async function handleAddCategory() {
    if (!newCatName.trim() || !onAddCategory) return;
    setSavingCat(true);
    const { error: err } = await onAddCategory(newCatName.trim(), form.type);
    setSavingCat(false);
    if (!err) {
      setForm((prev) => ({ ...prev, category: newCatName.trim() }));
      setNewCatName("");
      setAddingCat(false);
    }
  }

  const customCatsForType = customCategories
    .filter((c) => c.type === form.type)
    .map((c) => c.name);

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
                    ? "bg-gp-income text-white"
                    : "bg-gp-expense text-white"
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
      <div>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
        >
          <optgroup label="Predefinidas">
            {CATEGORIES[form.type].map((cat) => (
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
        {!addingCat ? (
          <button
            type="button"
            onClick={() => setAddingCat(true)}
            className="mt-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5"
          >
            + Nueva categoría
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
              className="px-1.5 py-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-gp-danger font-medium">{error}</p>}
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
  prevMonthTransactions = [],
  onFill,
  onAdd,
  onDelete,
  onUpdate,
  onReorder,
  customCategories,
  onAddCategory,
}) {
  const [manageOpen, setManageOpen] = useState(false);
  const [pendingCollapsed, setPendingCollapsed] = useState(false);
  const [orderedPending, setOrderedPending] = useState(pendingItems);
  const [orderedManage, setOrderedManage] = useState(fixedItems);
  useEffect(() => setOrderedPending(pendingItems), [pendingItems]);
  useEffect(() => setOrderedManage(fixedItems), [fixedItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  function handlePendingDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIdx = orderedPending.findIndex((fi) => fi.id === active.id);
    const newIdx = orderedPending.findIndex((fi) => fi.id === over.id);
    const newPending = arrayMove(orderedPending, oldIdx, newIdx);
    setOrderedPending(newPending);
    const pendingIdSet = new Set(newPending.map((p) => p.id));
    const positions = fixedItems
      .map((fi, i) => (pendingIdSet.has(fi.id) ? i : -1))
      .filter((i) => i !== -1);
    const newFull = [...fixedItems];
    positions.forEach((pos, idx) => {
      newFull[pos] = newPending[idx];
    });
    onReorder?.(newFull.map((fi) => fi.id));
  }

  function handleManageDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIdx = orderedManage.findIndex((fi) => fi.id === active.id);
    const newIdx = orderedManage.findIndex((fi) => fi.id === over.id);
    const newOrder = arrayMove(orderedManage, oldIdx, newIdx);
    setOrderedManage(newOrder);
    onReorder?.(newOrder.map((fi) => fi.id));
  }

  // Build a map of fixed_item_id -> amount from the previous month's transactions
  const prevAmountMap = new Map(
    prevMonthTransactions
      .filter((t) => t.fixed_item_id != null)
      .map((t) => [t.fixed_item_id, t.amount]),
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Pending items for this month */}
      <div className="px-5 pt-4 pb-3">
        <button
          onClick={() => setPendingCollapsed((s) => !s)}
          className="flex items-center justify-between w-full mb-1 group"
        >
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
              Fijos del mes
            </h2>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${pendingCollapsed ? "-rotate-90" : ""}`}
              strokeWidth={2.5}
            />
          </div>
          <span className="text-xs text-slate-400">
            {pendingItems.length === 0
              ? "Todo cargado ✓"
              : `${pendingItems.length} pendiente${pendingItems.length > 1 ? "s" : ""}`}
          </span>
        </button>

        {!pendingCollapsed && (
          <>
            {pendingItems.length === 0 && fixedItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No tenés gastos fijos configurados.
              </p>
            ) : pendingItems.length === 0 ? (
              <p className="text-xs text-gp-income-text font-medium py-2">
                Todos los fijos del mes ya están cargados.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePendingDragEnd}
              >
                <SortableContext
                  items={orderedPending.map((fi) => fi.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedPending.map((item) => (
                    <SortablePendingFixedItem
                      key={item.id}
                      item={item}
                      onFill={onFill}
                      prevMonthAmount={prevAmountMap.get(item.id) ?? null}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </>
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
            {orderedManage.length > 0 && (
              <div className="mb-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleManageDragEnd}
                >
                  <SortableContext
                    items={orderedManage.map((fi) => fi.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedManage.map((item) => (
                      <SortableFixedItemRow
                        key={item.id}
                        item={item}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
            <AddFixedItemForm
              onAdd={onAdd}
              customCategories={customCategories}
              onAddCategory={onAddCategory}
            />
          </div>
        )}
      </div>
    </div>
  );
}
