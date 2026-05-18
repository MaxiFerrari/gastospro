import {
  Loader2,
  LogOut,
  Moon,
  Sun,
  Plus,
} from "lucide-react";
import { hubModeSubtitle, hubModeTitle } from "@lib/lifeHub";

const iconBtn =
  "btn-icon flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg transition-colors flex-shrink-0";

export default function AppHeader({
  mode,
  page,
  loading,
  dark,
  user,
  onOpenForm,
  onToggleDark,
  onSignOut,
}) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="w-full px-3 sm:px-6 py-2.5 sm:py-4 flex items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
            {hubModeTitle(mode)}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block truncate">
            {hubModeSubtitle(mode)}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {mode === "finance" && loading && (
            <Loader2 className="w-4 h-4 text-slate-300 animate-spin flex-shrink-0" />
          )}
          {mode === "finance" && page === "monthly" && (
            <button
              type="button"
              onClick={onOpenForm}
              aria-label="Nuevo movimiento"
              className={`${iconBtn} bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-80 active:opacity-70`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Cambiar tema"
            className={`${iconBtn} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gp-pending hover:bg-slate-200 dark:hover:bg-slate-600`}
          >
            {dark ? (
              <Sun className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-8 h-8 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
            />
          )}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Cerrar sesión"
            className={`${iconBtn} text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700`}
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
