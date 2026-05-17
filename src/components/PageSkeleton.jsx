import { Loader2 } from "lucide-react";

export default function PageSkeleton({ label = "Cargando…" }) {
  return (
    <div
      className="flex items-center justify-center py-24"
      aria-busy="true"
      aria-label={label}
    >
      <Loader2 className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-spin" />
    </div>
  );
}
