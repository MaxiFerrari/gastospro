import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Clock, Target } from "lucide-react";
import { formatCurrency } from "@lib/amount";
import { countsInMonthlyTotals } from "@lib/transactionTotals";

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
        className={`shrink-0 p-3 rounded-xl ${isPositive ? "bg-gp-installment-surface dark:bg-gp-installment-surface-dark" : "bg-gp-expense-surface dark:bg-gp-expense-surface-dark"}`}
      >
        <Target
          className={`w-6 h-6 ${isPositive ? "text-gp-installment" : "text-gp-danger"}`}
          strokeWidth={2}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
          Saldo proyectado
        </p>
        {hasAmounts ? (
          <p
            className={`text-lg font-bold ${isPositive ? "text-gp-installment" : "text-gp-danger"}`}
          >
            {isPositive ? "" : "-"}
            {formatCurrency(projectedBalance)}
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
              <span className="text-gp-expense-text font-medium">
                −{formatCurrency(pendingFixedExpenses)} estimado
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
  const formatted = formatCurrency(amount);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
      <div className={`flex-shrink-0 ${bgClass} p-2.5 sm:p-3 rounded-xl`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-base sm:text-lg font-bold ${colorClass} truncate`}>
          {formatted}
        </p>
        {deltaText && (
          <p
            className={`text-xs font-medium mt-0.5 ${
              deltaGood ? "text-gp-income" : "text-gp-expense-text"
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
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "income" &&
          t.amount != null,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "expense" &&
          t.amount != null,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingExpenses = transactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "expense" &&
          t.amount != null &&
          t.status !== "paid",
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses, pendingExpenses };
  }, [transactions]);

  const prevSummary = useMemo(() => {
    if (!prevTransactions?.length) return null;
    const income = prevTransactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "income" &&
          t.amount != null,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = prevTransactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "expense" &&
          t.amount != null,
      )
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
              : "text-gp-danger"
          }
          bgClass={
            summary.balance >= 0
              ? "bg-slate-100 dark:bg-slate-700"
              : "bg-gp-expense-surface dark:bg-gp-expense-surface-dark"
          }
          deltaText={balanceDeltaText}
          deltaGood={summary.balance - (prevSummary?.balance ?? 0) >= 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Ingresos"
          amount={summary.income}
          colorClass="text-gp-income-text"
          bgClass="bg-gp-income-surface dark:bg-gp-income-surface-dark"
          deltaText={incomeDeltaText}
          deltaGood={summary.income - (prevSummary?.income ?? 0) >= 0}
        />
        <StatCard
          icon={TrendingDown}
          label="Egresos"
          amount={summary.expenses}
          colorClass="text-gp-expense-text"
          bgClass="bg-gp-expense-surface dark:bg-gp-expense-surface-dark"
          deltaText={expensesDeltaText}
          deltaGood={expensesPct <= 0}
        />
        <StatCard
          icon={Clock}
          label="Por pagar"
          amount={summary.pendingExpenses}
          colorClass="text-gp-pending-text dark:text-gp-pending"
          bgClass="bg-gp-pending-surface dark:bg-gp-pending-surface-dark"
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
