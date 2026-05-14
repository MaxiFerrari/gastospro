import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Clock, Target } from "lucide-react";

function fmt(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Math.abs(n));
}

function ProjectedBalanceCard({
  projectedBalance,
  pendingFixedExpenses,
  pendingExpenseFixedCount,
}) {
  const isPositive = projectedBalance >= 0;
  const hasAmounts = pendingFixedExpenses > 0;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
      <div
        className={`shrink-0 p-3 rounded-xl ${isPositive ? "bg-violet-50 dark:bg-violet-950" : "bg-red-50 dark:bg-red-950"}`}
      >
        <Target
          className={`w-6 h-6 ${isPositive ? "text-violet-500" : "text-red-500"}`}
          strokeWidth={2}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
          Saldo proyectado
        </p>
        {hasAmounts ? (
          <p
            className={`text-lg font-bold ${isPositive ? "text-violet-600 dark:text-violet-400" : "text-red-500"}`}
          >
            {isPositive ? "" : "-"}
            {fmt(projectedBalance)}
          </p>
        ) : (
          <p className="text-lg font-bold text-slate-400 dark:text-slate-500">
            —
          </p>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-0.5">
          {pendingExpenseFixedCount} egreso
          {pendingExpenseFixedCount !== 1 ? "s" : ""} fijo
          {pendingExpenseFixedCount !== 1 ? "s" : ""} pendiente
          {pendingExpenseFixedCount !== 1 ? "s" : ""}
          {hasAmounts && (
            <>
              {" · "}
              <span className="text-red-400 font-medium">
                −{fmt(pendingFixedExpenses)} estimado
              </span>
            </>
          )}
          {!hasAmounts && (
            <span className="text-slate-300 dark:text-slate-600">
              {" · "}sin datos del mes ant.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  amount,
  colorClass,
  bgClass,
  deltaText,
  deltaGood,
}) {
  const formatted = fmt(amount);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`flex-shrink-0 ${bgClass} p-3 rounded-xl`}>
        <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-lg font-bold ${colorClass} truncate`}>
          {formatted}
        </p>
        {deltaText && (
          <p
            className={`text-xs font-medium mt-0.5 ${
              deltaGood ? "text-emerald-500" : "text-red-400"
            }`}
          >
            {deltaText} vs mes ant.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SummaryPanel({
  transactions,
  prevTransactions,
  pendingFixedExpenses = 0,
  pendingExpenseFixedCount = 0,
}) {
  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income" && t.amount != null)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense" && t.amount != null)
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingExpenses = transactions
      .filter(
        (t) => t.type === "expense" && t.amount != null && t.status !== "paid",
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses, pendingExpenses };
  }, [transactions]);

  const prevSummary = useMemo(() => {
    if (!prevTransactions?.length) return null;
    const income = prevTransactions
      .filter((t) => t.type === "income" && t.amount != null)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = prevTransactions
      .filter((t) => t.type === "expense" && t.amount != null)
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [prevTransactions]);

  function delta(current, prev) {
    if (!prevSummary || prev === 0) return null;
    const pct = ((current - prev) / Math.abs(prev)) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  }

  const balanceDeltaText = delta(summary.balance, prevSummary?.balance);
  const incomeDeltaText = delta(summary.income, prevSummary?.income);
  const expensesDeltaText = delta(summary.expenses, prevSummary?.expenses);

  const projectedBalance = summary.balance - pendingFixedExpenses;

  // For expenses: spending LESS is good
  const expensesPct = prevSummary?.expenses
    ? ((summary.expenses - prevSummary.expenses) /
        Math.abs(prevSummary.expenses)) *
      100
    : 0;

  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Wallet}
          label="Saldo"
          amount={summary.balance}
          colorClass={
            summary.balance >= 0
              ? "text-slate-700 dark:text-slate-100"
              : "text-red-500"
          }
          bgClass={
            summary.balance >= 0
              ? "bg-slate-100 dark:bg-slate-700"
              : "bg-red-50 dark:bg-red-950"
          }
          deltaText={balanceDeltaText}
          deltaGood={summary.balance - (prevSummary?.balance ?? 0) >= 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Ingresos"
          amount={summary.income}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50 dark:bg-emerald-950"
          deltaText={incomeDeltaText}
          deltaGood={summary.income - (prevSummary?.income ?? 0) >= 0}
        />
        <StatCard
          icon={TrendingDown}
          label="Egresos"
          amount={summary.expenses}
          colorClass="text-red-400"
          bgClass="bg-red-50 dark:bg-red-950"
          deltaText={expensesDeltaText}
          deltaGood={expensesPct <= 0}
        />
        <StatCard
          icon={Clock}
          label="Por pagar"
          amount={summary.pendingExpenses}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-100 dark:bg-amber-950"
        />
      </div>

      {pendingExpenseFixedCount > 0 && (
        <ProjectedBalanceCard
          projectedBalance={projectedBalance}
          pendingFixedExpenses={pendingFixedExpenses}
          pendingExpenseFixedCount={pendingExpenseFixedCount}
        />
      )}
    </div>
  );
}
