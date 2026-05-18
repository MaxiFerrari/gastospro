import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * @param {{ title: string; subtitle?: string; backTo: string; backLabel?: string }} props
 */
export default function HubSubpageHeader({
  title,
  subtitle,
  backTo,
  backLabel = "Volver",
}) {
  const navigate = useNavigate();

  return (
    <header className="app-hub-inset mb-4 sm:mx-0">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>
      <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h1>
      {subtitle && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      )}
    </header>
  );
}
