import { Loader2 } from "lucide-react";

export default function ChartSkeleton({
  title,
  height = 220,
  className = "",
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 mb-6 animate-pulse ${className}`}
      aria-busy="true"
      aria-label={title ? `Cargando ${title}` : "Cargando gráfico"}
    >
      {title && (
        <div className="h-5 w-40 rounded-md bg-slate-100 dark:bg-slate-700 mb-4" />
      )}
      <div
        className="rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="w-6 h-6 text-slate-300 dark:text-slate-600 animate-spin" />
      </div>
    </div>
  );
}
