/**
 * Shared form control chrome (light/dark). Used by ui/TextField, AmountField, etc.
 * Keep in sync with movement forms (TransactionForm).
 */

/** Full-width text / amount / select — default padding. */
export const inputControlClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-500 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-500";

/** Tighter controls (e.g. inline edit in lists). */
export const inputControlClassCompact =
  "rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-500 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-500";

export const labelClass =
  "block text-xs font-medium text-slate-500 dark:text-slate-400";

export const hintClass = "mt-1 text-xs text-slate-400 dark:text-slate-500";

export const fieldErrorClass = "mt-1 text-xs font-medium text-gp-danger";
