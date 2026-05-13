import { useState, useRef } from "react";
import {
  Trash2,
  Pencil,
  Check,
  X,
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

function TransactionItem({ transaction, onDelete, onUpdate }) {
  const Icon = CATEGORY_ICONS[transaction.category] ?? HelpCircle;
  const isIncome = transaction.type === "income";
  const isOptimistic = String(transaction.id).startsWith("optimistic-");

  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(transaction.description);
  const [editAmount, setEditAmount] = useState(String(transaction.amount));
  const descRef = useRef(null);

  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(transaction.amount);

  const dateStr = new Date(transaction.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });

  function startEdit() {
    setEditDesc(transaction.description);
    setEditAmount(String(transaction.amount));
    setEditing(true);
    setTimeout(() => descRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function confirmEdit() {
    const amount = parseFloat(editAmount);
    if (!editDesc.trim() || isNaN(amount) || amount <= 0) return;
    setEditing(false);
    await onUpdate(transaction.id, {
      description: editDesc.trim(),
      amount,
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 border-b border-slate-100">
        <div
          className={`flex-shrink-0 p-2 rounded-xl ${isIncome ? "bg-emerald-50" : "bg-red-50"}`}
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
            className="text-sm border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300"
            maxLength={120}
          />
          <input
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            min="0.01"
            step="0.01"
            className="text-sm border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <button
          onClick={confirmEdit}
          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
        >
          <Check className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={cancelEdit}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 py-3.5 px-1 border-b border-slate-100 last:border-0 transition-opacity ${isOptimistic ? "opacity-60" : "opacity-100"}`}
    >
      <div
        className={`flex-shrink-0 p-2 rounded-xl ${isIncome ? "bg-emerald-50" : "bg-red-50"}`}
      >
        <Icon
          className={`w-4 h-4 ${isIncome ? "text-emerald-500" : "text-red-400"}`}
          strokeWidth={2}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-slate-400">
          {transaction.category} · {dateStr}
        </p>
      </div>

      <span
        className={`text-sm font-bold flex-shrink-0 ${isIncome ? "text-emerald-600" : "text-red-500"}`}
      >
        {isIncome ? "+" : "-"}
        {formatted}
      </span>

      <button
        onClick={startEdit}
        disabled={isOptimistic}
        aria-label="Editar"
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors disabled:pointer-events-none"
      >
        <Pencil className="w-4 h-4" strokeWidth={2} />
      </button>

      <button
        onClick={() => onDelete(transaction.id)}
        disabled={isOptimistic}
        aria-label="Eliminar"
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:pointer-events-none"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export default function TransactionList({ transactions, onDelete, onUpdate }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-700">Movimientos</h2>
      </div>
      <div className="px-4 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-300px)]">
        {transactions.map((t) => (
          <TransactionItem
            key={t.id}
            transaction={t}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}
