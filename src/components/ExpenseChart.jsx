import { useMemo } from "react";
import { countsInMonthlyTotals } from "../lib/transactionTotals";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{name}</p>
      <p className="text-slate-500 dark:text-slate-400">{fmt.format(value)}</p>
    </div>
  );
}

export default function ExpenseChart({ transactions }) {
  const data = useMemo(() => {
    const expenses = transactions.filter(
      (t) =>
        countsInMonthlyTotals(t) &&
        t.type === "expense" &&
        t.amount != null,
    );
    const map = {};
    for (const t of expenses) {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Egresos por categoría
        </h2>
        <p className="text-sm text-slate-300 dark:text-slate-600 mt-4 text-center py-4">
          Sin egresos en este período
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Egresos por categoría
      </h2>
      <div className="min-w-0 w-full max-w-full">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
