import {
  Loader2,
  LogOut,
  Moon,
  Sun,
  Plus,
} from "lucide-react";
import { hubModeSubtitle, hubModeTitle } from "../lib/lifeHub";

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
    <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
      <div className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
            {hubModeTitle(mode)}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block truncate">
            {hubModeSubtitle(mode)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-4">
          {mode === "finance" && loading && (
            <Loader2 className="w-4 h-4 text-slate-300 animate-spin flex-shrink-0" />
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {mode === "finance" && page === "monthly" && (
              <button
                type="button"
                onClick={onOpenForm}
                aria-label="Nuevo movimiento"
                className="p-2 sm:p-1.5 rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-80 active:opacity-70 transition-opacity"
              >
                <Plus
                  className="w-5 sm:w-4 h-5 sm:h-4"
                  strokeWidth={2.5}
                />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleDark}
              aria-label="Cambiar tema"
              className="p-1.5 rounded-lg transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gp-pending hover:bg-slate-200 dark:hover:bg-slate-600"
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
              className="p-2 sm:p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <LogOut className="w-5 sm:w-4 h-5 sm:w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
