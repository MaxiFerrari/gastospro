import {
  Trash2,
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

function TransactionItem({ transaction, onDelete }) {
  const Icon = CATEGORY_ICONS[transaction.category] ?? HelpCircle;
  const isIncome = transaction.type === "income";
  const isOptimistic = String(transaction.id).startsWith("optimistic-");

  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(transaction.amount);

  const dateStr = new Date(transaction.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={`flex items-center gap-3 py-3.5 px-1 border-b border-slate-100 last:border-0 transition-opacity ${isOptimistic ? "opacity-60" : "opacity-100"}`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 p-2 rounded-xl ${isIncome ? "bg-emerald-50" : "bg-red-50"}`}
      >
        <Icon
          className={`w-4 h-4 ${isIncome ? "text-emerald-500" : "text-red-400"}`}
          strokeWidth={2}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-slate-400">
          {transaction.category} · {dateStr}
        </p>
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-bold flex-shrink-0 ${isIncome ? "text-emerald-600" : "text-red-500"}`}
      >
        {isIncome ? "+" : "-"}
        {formatted}
      </span>

      {/* Delete */}
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

export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <p className="text-slate-400 text-sm">
          No hay movimientos registrados.
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
      <div className="px-4 overflow-y-auto max-h-[420px]">
        {transactions.map((t) => (
          <TransactionItem key={t.id} transaction={t} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
