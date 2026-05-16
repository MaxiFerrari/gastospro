import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import TransactionForm from "./TransactionForm";

export default function TransactionDrawer({
  open,
  onClose,
  onAdd,
  onAddInstallments,
  customCategories,
  onAddCategory,
  userId,
  transactions,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-drawer-title"
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="transaction-drawer-title"
            className="text-base font-semibold text-slate-700 dark:text-slate-200"
          >
            Nuevo movimiento
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <TransactionForm
          onAdd={(tx) => {
            onAdd(tx);
            onClose();
          }}
          onAddInstallments={(payload, count) => {
            onAddInstallments(payload, count);
            onClose();
          }}
          customCategories={customCategories}
          onAddCategory={onAddCategory}
          userId={userId}
          transactions={transactions}
        />
      </div>
    </div>
  );
}
