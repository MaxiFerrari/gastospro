import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { countsInMonthlyTotals } from "../lib/transactionTotals";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";

const MONTHS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#6366f1",
];

const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const fmtFull = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

function StatCard({ icon: Icon, label, amount, colorClass, bgClass }) {
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
          {fmtFull.format(Math.abs(amount))}
        </p>
      </div>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt.format(p.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{name}</p>
      <p className="text-slate-500 dark:text-slate-400">{fmt.format(value)}</p>
    </div>
  );
}

export default function AnnualView({ transactions, dark }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const yearTransactions = useMemo(
    () =>
      transactions.filter(
        (t) => new Date(t.created_at).getUTCFullYear() === year,
      ),
    [transactions, year],
  );

  const { income, expenses, balance } = useMemo(() => {
    const income = yearTransactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "income" &&
          t.amount != null,
      )
      .reduce((s, t) => s + t.amount, 0);
    const expenses = yearTransactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "expense" &&
          t.amount != null,
      )
      .reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [yearTransactions]);

  const monthlyData = useMemo(
    () =>
      MONTHS_ES.map((name, i) => {
        const mx = yearTransactions.filter(
          (t) => new Date(t.created_at).getUTCMonth() === i,
        );
        const ing = mx
          .filter(
            (t) =>
              countsInMonthlyTotals(t) &&
              t.type === "income" &&
              t.amount != null,
          )
          .reduce((s, t) => s + t.amount, 0);
        const eg = mx
          .filter(
            (t) =>
              countsInMonthlyTotals(t) &&
              t.type === "expense" &&
              t.amount != null,
          )
          .reduce((s, t) => s + t.amount, 0);
        return { name, Ingresos: ing, Egresos: eg };
      }),
    [yearTransactions],
  );

  const pieData = useMemo(() => {
    const map = {};
    yearTransactions
      .filter(
        (t) =>
          countsInMonthlyTotals(t) &&
          t.type === "expense" &&
          t.amount != null,
      )
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearTransactions]);

  const balanceTrendData = useMemo(() => {
    let cumulative = 0;
    return MONTHS_ES.map((name, i) => {
      const mx = yearTransactions.filter(
        (t) =>
          new Date(t.created_at).getUTCMonth() === i &&
          t.amount != null &&
          countsInMonthlyTotals(t),
      );
      const net = mx.reduce(
        (s, t) => s + (t.type === "income" ? t.amount : -t.amount),
        0,
      );
      cumulative += net;
      return { name, Saldo: cumulative };
    });
  }, [yearTransactions]);

  // recharts SVG theme colors
  const gridColor = dark ? "#334155" : "#e2e8f0";
  const tickColor = dark ? "#94a3b8" : "#64748b";

  return (
    <div>
      {/* Year selector */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Año anterior"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-14 text-center">
          {year}
        </span>
        <button
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= now.getFullYear()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Año siguiente"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={Wallet}
          label="Balance anual"
          amount={balance}
          colorClass={
            balance >= 0 ? "text-slate-700 dark:text-slate-100" : "text-gp-danger"
          }
          bgClass={
            balance >= 0
              ? "bg-slate-100 dark:bg-slate-700"
              : "bg-gp-expense-surface dark:bg-gp-expense-surface-dark"
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Ingresos totales"
          amount={income}
          colorClass="text-gp-income-text"
          bgClass="bg-gp-income-surface dark:bg-gp-income-surface-dark"
        />
        <StatCard
          icon={TrendingDown}
          label="Egresos totales"
          amount={expenses}
          colorClass="text-gp-expense-text"
          bgClass="bg-gp-expense-surface dark:bg-gp-expense-surface-dark"
        />
      </div>

      {yearTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-10 text-center">
          <p className="text-sm text-slate-300 dark:text-slate-600">
            Sin movimientos registrados en {year}
          </p>
        </div>
      ) : (
        <>
          {/* Bar chart: monthly income vs expenses */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Ingresos vs Egresos por mes
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmt.format(v)}
                  tick={{ fontSize: 10, fill: tickColor }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: dark ? "#1e293b" : "#f8fafc" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {v}
                    </span>
                  )}
                />
                <Bar
                  dataKey="Ingresos"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="Egresos"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line chart: cumulative balance trend */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Tendencia de saldo acumulado
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={balanceTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmt.format(v)}
                  tick={{ fontSize: 10, fill: tickColor }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ stroke: dark ? "#475569" : "#e2e8f0" }}
                />
                <ReferenceLine
                  y={0}
                  stroke={dark ? "#475569" : "#cbd5e1"}
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart: expenses by category */}
          {pieData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Egresos por categoría
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
