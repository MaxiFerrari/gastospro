import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

function StatCard({ icon: Icon, label, amount, colorClass, bgClass }) {
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`flex-shrink-0 ${bgClass} p-3 rounded-xl`}>
        <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-lg font-bold ${colorClass} truncate`}>{formatted}</p>
      </div>
    </div>
  );
}

export default function SummaryPanel({ transactions }) {
  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <StatCard
        icon={Wallet}
        label="Saldo"
        amount={summary.balance}
        colorClass={summary.balance >= 0 ? "text-slate-700" : "text-red-500"}
        bgClass={summary.balance >= 0 ? "bg-slate-100" : "bg-red-50"}
      />
      <StatCard
        icon={TrendingUp}
        label="Ingresos"
        amount={summary.income}
        colorClass="text-emerald-600"
        bgClass="bg-emerald-50"
      />
      <StatCard
        icon={TrendingDown}
        label="Egresos"
        amount={summary.expenses}
        colorClass="text-red-500"
        bgClass="bg-red-50"
      />
    </div>
  );
}
