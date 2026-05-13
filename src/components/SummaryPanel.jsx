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
      <div className={`${bgClass} p-3 rounded-xl`}>
        <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-xl font-bold ${colorClass}`}>{formatted}</p>
      </div>
    </div>
  );
}

export default function SummaryPanel({ transactions }) {
  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTx = transactions.filter((t) => {
      const date = new Date(t.created_at);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const income = monthlyTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const monthName = new Date().toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mb-6">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3 px-1 capitalize">
        {monthName}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    </div>
  );
}
