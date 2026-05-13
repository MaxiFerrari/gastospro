import { useState, useRef, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useMonthFilter } from "./hooks/useMonthFilter";
import { useFixedItems } from "./hooks/useFixedItems";
import { useCategories } from "./hooks/useCategories";
import { useBudgets } from "./hooks/useBudgets";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { useExchangeRate } from "./hooks/useExchangeRate";
import SummaryPanel from "./components/SummaryPanel";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import ExpenseChart from "./components/ExpenseChart";
import FixedItemsPanel from "./components/FixedItemsPanel";
import BudgetPanel from "./components/BudgetPanel";
import AnnualView from "./components/AnnualView";
import SubscriptionsPage from "./components/SubscriptionsPage";
import MonthComparisonPanel from "./components/MonthComparisonPanel";
import { InstallPrompt, OfflineBanner } from "./components/InstallPrompt";
import LoginScreen from "./components/LoginScreen";
import Toaster from "./components/Toaster";
import { toast, toastConfirm } from "./lib/toast";

export default function App() {
  const { session, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const userId = session?.user?.id ?? null;
  const {
    transactions,
    loading,
    error,
    addTransaction,
    addInstallments,
    deleteTransaction,
    updateTransaction,
    toggleStatus,
    reorderTransactions,
  } = useTransactions(userId);

  const {
    label,
    isCurrentMonth,
    year,
    month,
    goToPrev,
    goToNext,
    goToMonth,
    pickerPrevYear,
    pickerNextYear,
    filterTransactions,
  } = useMonthFilter();

  const {
    fixedItems,
    addFixedItem,
    deleteFixedItem,
    updateFixedItem,
    reorderFixedItems,
  } = useFixedItems(userId);

  const { customCategories, addCategory } = useCategories(userId);
  const { budgets, upsertBudget, deleteBudget } = useBudgets(userId);
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleActive: toggleSubscription,
  } = useSubscriptions(userId);

  const { rate: exchangeRate, setRate: setExchangeRate } = useExchangeRate();

  // Sort: fixed-item transactions always first (by fixedItem.sort_order),
  // then regular transactions (by sort_order / created_at desc).
  const sortedMonthlyTransactions = useMemo(() => {
    const fixedMap = new Map(fixedItems.map((fi) => [fi.id, fi]));
    return [...filterTransactions(transactions)].sort((a, b) => {
      const fiA = a.fixed_item_id ? fixedMap.get(a.fixed_item_id) : null;
      const fiB = b.fixed_item_id ? fixedMap.get(b.fixed_item_id) : null;
      // Both fixed: sort by fixed_item.sort_order
      if (fiA && fiB) return (fiA.sort_order ?? 0) - (fiB.sort_order ?? 0);
      // Fixed before regular
      if (fiA) return -1;
      if (fiB) return 1;
      // Both regular: sort by transaction.sort_order if set, else created_at desc
      if (a.sort_order != null && b.sort_order != null)
        return a.sort_order - b.sort_order;
      if (a.sort_order != null) return -1;
      if (b.sort_order != null) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [transactions, fixedItems, filterTransactions]);

  const monthlyTransactions = sortedMonthlyTransactions;

  // Transactions from the previous month (for delta comparison)
  const prevMonthTransactions = useMemo(() => {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    return transactions.filter((t) => {
      const d = new Date(t.created_at);
      return d.getUTCMonth() === pm && d.getUTCFullYear() === py;
    });
  }, [transactions, year, month]);

  // Fixed items that have no transaction for this month yet
  const pendingFixedItems = fixedItems.filter(
    (fi) => !monthlyTransactions.some((t) => t.fixed_item_id === fi.id),
  );

  // Sum of expected expense amounts for pending fixed items (based on prev month)
  const { pendingFixedExpenses, pendingExpenseFixedCount } = useMemo(() => {
    const prevAmountMap = new Map(
      prevMonthTransactions
        .filter((t) => t.fixed_item_id != null)
        .map((t) => [t.fixed_item_id, t.amount]),
    );
    const expenseItems = pendingFixedItems.filter(
      (fi) => fi.type === "expense",
    );
    const total = expenseItems.reduce(
      (sum, fi) => sum + (prevAmountMap.get(fi.id) ?? 0),
      0,
    );
    return {
      pendingFixedExpenses: total,
      pendingExpenseFixedCount: expenseItems.length,
    };
  }, [pendingFixedItems, prevMonthTransactions]);

  // Returns a date string set to the 15th of the selected month at noon UTC
  // to avoid timezone edge cases and ensure correct month filtering
  function monthDate() {
    return new Date(Date.UTC(year, month, 15, 12, 0, 0)).toISOString();
  }

  async function handleAddTransaction(payload) {
    const result = await addTransaction({
      ...payload,
      created_at: isCurrentMonth ? undefined : monthDate(),
    });
    if (result?.error) toast("Error al guardar el movimiento", "error");
    else toast("Movimiento agregado");
    return result;
  }

  async function handleAddInstallments(payload, count, startYear, startMonth) {
    const result = await addInstallments(payload, count, startYear, startMonth);
    if (result?.error) toast("Error al guardar las cuotas", "error");
    else toast(`${count} cuotas registradas`);
    return result;
  }

  async function handleDeleteTransaction(id) {
    toastConfirm("¿Eliminar este movimiento?", async () => {
      await deleteTransaction(id);
      toast("Movimiento eliminado");
    });
  }

  async function handleUpdateTransaction(id, patch) {
    const result = await updateTransaction(id, patch);
    if (result?.error) toast(result.error, "error");
    else toast("Movimiento actualizado");
    return result;
  }

  async function fillFixedItem(fixedItem, amount) {
    const fixedIndex = fixedItems.findIndex((fi) => fi.id === fixedItem.id);
    const result = await addTransaction({
      description: fixedItem.description,
      category: fixedItem.category,
      type: fixedItem.type,
      amount,
      fixed_item_id: fixedItem.id,
      sort_order: fixedIndex >= 0 ? fixedIndex : undefined,
      created_at: isCurrentMonth ? undefined : monthDate(),
    });
    if (result?.error)
      toast(`Error al registrar ${fixedItem.description}`, "error");
    else toast(`${fixedItem.description} registrado`);
  }

  async function handleDeleteFixedItem(id) {
    await deleteFixedItem(id);
    toast("Fijo eliminado");
  }

  async function handleUpdateFixedItem(id, payload) {
    const result = await updateFixedItem(id, payload);
    if (result?.error) toast(result.error, "error");
    else toast("Fijo actualizado");
    return result;
  }

  async function handleReorder(newOrder) {
    // Update transactions sort_order
    await reorderTransactions(newOrder.map((t) => t.id));
    // Update fixed_items sort_order based on relative order of fixed-item transactions
    const fixedInOrder = newOrder.filter((t) => t.fixed_item_id != null);
    if (fixedInOrder.length > 0) {
      await reorderFixedItems(fixedInOrder.map((t) => t.fixed_item_id));
    }
  }

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const [page, setPage] = useState("monthly");
  const [formOpen, setFormOpen] = useState(false);

  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") !== "light",
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const MONTHS_ES = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const now = new Date();

  // session === undefined means we're still loading the auth state
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    );
  }

  if (!session) {
    const handleSignIn = async () => {
      setSigningIn(true);
      await signInWithGoogle();
      setSigningIn(false);
    };
    return <LoginScreen onSignIn={handleSignIn} loading={signingIn} />;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <OfflineBanner />
      <InstallPrompt />
      <Toaster />
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Gastos-Pro
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Control de gastos mensuales
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
            )}
            <div className="flex items-center gap-2">
              {/* Add transaction button — only on monthly page */}
              {page === "monthly" && (
                <button
                  onClick={() => setFormOpen(true)}
                  aria-label="Nuevo movimiento"
                  className="p-1.5 rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={() => setDark((d) => !d)}
                aria-label="Cambiar tema"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {dark ? (
                  <Sun className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <Moon className="w-4 h-4" strokeWidth={2} />
                )}
              </button>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
              )}
              <button
                onClick={signOut}
                aria-label="Cerrar sesión"
                className="p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* New transaction drawer */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false);
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Nuevo movimiento
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <TransactionForm
              onAdd={(tx) => {
                handleAddTransaction(tx);
                setFormOpen(false);
              }}
              onAddInstallments={(txs) => {
                handleAddInstallments(txs);
                setFormOpen(false);
              }}
              customCategories={customCategories}
              onAddCategory={addCategory}
              userId={userId}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="w-full px-6 py-6">
        {/* Page tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {["monthly", "annual", "subs"].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {p === "monthly" ? "Mensual" : p === "annual" ? "Anual" : "Subs"}
            </button>
          ))}
        </div>
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Error al cargar datos
              </p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
              aria-label="Reintentar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Month navigator with picker — hidden on annual page */}
        {page === "monthly" && (
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={goToPrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Clickable label opens picker */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setPickerOpen((o) => !o)}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {label.charAt(0).toUpperCase() + label.slice(1)} ▾
              </button>

              {/* Month picker dropdown */}
              {pickerOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 w-64">
                  {/* Year navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={pickerPrevYear}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {year}
                    </span>
                    <button
                      onClick={pickerNextYear}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                  {/* Month grid */}
                  <div className="grid grid-cols-4 gap-1">
                    {MONTHS_ES.map((name, i) => {
                      const isSelected = i === month && year === year;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            goToMonth(i, year);
                            setPickerOpen(false);
                          }}
                          className={`py-1.5 rounded-xl text-xs font-medium transition-colors
                          ${isSelected ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={goToNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        )}

        {page === "subs" ? (
          <SubscriptionsPage
            subscriptions={subscriptions}
            fixedItems={fixedItems}
            exchangeRate={exchangeRate}
            onSetRate={setExchangeRate}
            onAdd={addSubscription}
            onUpdate={updateSubscription}
            onDelete={deleteSubscription}
            onToggle={toggleSubscription}
          />
        ) : page === "annual" ? (
          <AnnualView transactions={transactions} dark={dark} />
        ) : (
          <>
            {/* Summary cards */}
            <SummaryPanel
              transactions={monthlyTransactions}
              prevTransactions={prevMonthTransactions}
              pendingFixedExpenses={pendingFixedExpenses}
              pendingExpenseFixedCount={pendingExpenseFixedCount}
            />

            {/* Month comparison panel */}
            {/* Two-column layout on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                <ExpenseChart transactions={monthlyTransactions} />
                <FixedItemsPanel
                  fixedItems={fixedItems}
                  pendingItems={pendingFixedItems}
                  prevMonthTransactions={prevMonthTransactions}
                  onFill={fillFixedItem}
                  onAdd={addFixedItem}
                  onDelete={handleDeleteFixedItem}
                  onUpdate={handleUpdateFixedItem}
                  customCategories={customCategories}
                  onAddCategory={addCategory}
                />
                <BudgetPanel
                  transactions={monthlyTransactions}
                  budgets={budgets}
                  onSave={async (cat, amount) => {
                    const r = await upsertBudget(cat, amount);
                    if (r?.error)
                      toast("Error al guardar presupuesto", "error");
                  }}
                  onDelete={deleteBudget}
                />
              </div>

              {/* Right column */}
              <div>
                {loading && transactions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 shadow-sm flex justify-center">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : (
                  <TransactionList
                    transactions={monthlyTransactions}
                    subscriptions={subscriptions.filter((s) => s.active)}
                    exchangeRate={exchangeRate}
                    onDelete={handleDeleteTransaction}
                    onUpdate={handleUpdateTransaction}
                    onToggleStatus={toggleStatus}
                    onReorder={handleReorder}
                  />
                )}
              </div>
            </div>

            {/* Month comparison panel — full width at bottom */}
            <MonthComparisonPanel
              transactions={monthlyTransactions}
              prevTransactions={prevMonthTransactions}
            />
          </>
        )}
      </main>
    </div>
  );
}
