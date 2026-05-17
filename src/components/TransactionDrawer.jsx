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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center"
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
        className="relative z-10 flex w-full max-h-[100dvh] sm:max-h-[92dvh] flex-col bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl sm:max-w-md shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5 sm:py-4">
          <h2
            id="transaction-drawer-title"
            className="text-base font-semibold text-slate-700 dark:text-slate-200"
          >
            Nuevo movimiento
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          <TransactionForm
            variant="drawer"
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
    </div>
  );
}
