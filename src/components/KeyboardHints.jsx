export default function KeyboardHints({ showMonthNav, showNew }) {
  if (!showMonthNav && !showNew) return null;

  return (
    <p className="hidden sm:block text-center text-[11px] text-slate-400 dark:text-slate-500 mb-4">
      {showNew && (
        <span>
          <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px]">
            N
          </kbd>{" "}
          nuevo movimiento
        </span>
      )}
      {showNew && showMonthNav && " · "}
      {showMonthNav && (
        <span>
          <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px]">
            ←
          </kbd>
          <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px] ml-0.5">
            →
          </kbd>{" "}
          cambiar mes
        </span>
      )}
    </p>
  );
}
