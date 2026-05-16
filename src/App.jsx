import { useState, useRef, useMemo } from "react";
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
  ShoppingCart,
  X,
  Cake,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useMonthFilter } from "./hooks/useMonthFilter";
import { useFixedItems } from "./hooks/useFixedItems";
import { useCategories } from "./hooks/useCategories";
import { useBudgets } from "./hooks/useBudgets";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { useUserPreferences } from "./hooks/useUserPreferences";
import SummaryPanel from "./components/SummaryPanel";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import ExpenseChart from "./components/ExpenseChart";
import FixedItemsPanel from "./components/FixedItemsPanel";
import BudgetPanel from "./components/BudgetPanel";
import AnnualView from "./components/AnnualView";
import SubscriptionsPage from "./components/SubscriptionsPage";
import ShoppingListPage from "./components/ShoppingListPage";
import HousekeeperPage from "./components/HousekeeperPage";
import MonthComparisonPanel from "./components/MonthComparisonPanel";
import EventsHub from "./components/EventsHub";
import { InstallPrompt, OfflineBanner } from "./components/InstallPrompt";
import LoginScreen from "./components/LoginScreen";
import Toaster from "./components/Toaster";
import { toast, toastConfirm, withToast } from "./lib/toast";
import { useOutsideClick } from "./hooks/useOutsideClick";

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

  const {
    rate: exchangeRate,
    setRate: setExchangeRate,
    dark,
    setDark,
  } = useUserPreferences(userId);

  // Sort: unified by transaction.sort_order; fallback for unsorted transactions:
  // fixed items use fixed_item.sort_order (appear first), regular items go last by created_at.
  const sortedMonthlyTransactions = useMemo(() => {
    const fixedMap = new Map(fixedItems.map((fi) => [fi.id, fi]));
    return [...filterTransactions(transactions)].sort((a, b) => {
      // Both have explicit transaction sort_order → use it (allows mixing fixed & manual)
      if (a.sort_order != null && b.sort_order != null)
        return a.sort_order - b.sort_order;
      // Only one has explicit sort_order → it comes first
      if (a.sort_order != null) return -1;
      if (b.sort_order != null) return 1;
      // Neither has explicit sort_order: fixed items use fixed_item.sort_order,
      // manual items go last (Infinity), then sort by created_at desc
      const fiA = a.fixed_item_id ? fixedMap.get(a.fixed_item_id) : null;
      const fiB = b.fixed_item_id ? fixedMap.get(b.fixed_item_id) : null;
      const aFallback = fiA != null ? (fiA.sort_order ?? 0) : Infinity;
      const bFallback = fiB != null ? (fiB.sort_order ?? 0) : Infinity;
      if (aFallback !== bFallback) return aFallback - bFallback;
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

  // Fixed items that have no transaction for this month yet (and are active)
  const pendingFixedItems = fixedItems.filter(
    (fi) =>
      fi.active !== false &&
      !monthlyTransactions.some((t) => t.fixed_item_id === fi.id),
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

  /** Tarjeta: primer impacto en el resumen / cuotas empieza el mes siguiente al seleccionado. */
  function monthDateNextAfterSelected() {
    return new Date(Date.UTC(year, month + 1, 15, 12, 0, 0)).toISOString();
  }

  async function handleAddTransaction(payload) {
    const created_at = payload.exclude_from_totals
      ? monthDateNextAfterSelected()
      : isCurrentMonth
        ? undefined
        : monthDate();
    return withToast(
      () =>
        addTransaction({
          ...payload,
          created_at,
        }),
      "Movimiento agregado",
      "Error al guardar el movimiento",
    );
  }

  async function addHousekeeperTransaction(payload) {
    return addTransaction(payload);
  }

  async function deleteHousekeeperTransaction(id) {
    return deleteTransaction(id);
  }

  async function updateHousekeeperTransaction(id, patch) {
    return updateTransaction(id, patch);
  }

  async function handleAddInstallments(payload, count) {
    let startY = year;
    let startM = month;
    if (payload.exclude_from_totals) {
      startM = month + 1;
      startY = year + Math.floor(startM / 12);
      startM = startM % 12;
    }
    return withToast(
      () => addInstallments(payload, count, startY, startM),
      `${count} cuotas registradas`,
      "Error al guardar las cuotas",
    );
  }

  async function handleDeleteTransaction(id) {
    toastConfirm("¿Eliminar este movimiento?", async () => {
      await deleteTransaction(id);
      toast("✓ Movimiento eliminado");
    });
  }

  async function handleDuplicate(transaction) {
    const dup = {
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      notes: transaction.notes,
      ...(transaction.exclude_from_totals
        ? { exclude_from_totals: true }
        : {}),
      created_at: transaction.exclude_from_totals
        ? monthDateNextAfterSelected()
        : isCurrentMonth
          ? undefined
          : monthDate(),
    };
    return withToast(
      () => addTransaction(dup),
      "Duplicado",
      "Error al duplicar",
    );
  }

  async function handleDeleteMultiple(ids) {
    if (!ids.length) return;
    const label =
      ids.length === 1 ? "1 movimiento" : `${ids.length} movimientos`;
    toastConfirm(`¿Eliminar ${label}?`, async () => {
      await Promise.all(ids.map((id) => deleteTransaction(id)));
      toast(`${label} eliminado${ids.length > 1 ? "s" : ""}`);
    });
  }

  async function handleUpdateTransaction(id, patch) {
    return withToast(
      () => updateTransaction(id, patch),
      "Movimiento actualizado",
    );
  }

  async function fillFixedItem(fixedItem, amount) {
    return withToast(
      () =>
        addTransaction({
          description: fixedItem.description,
          category: fixedItem.category,
          type: fixedItem.type,
          amount,
          fixed_item_id: fixedItem.id,
          created_at: isCurrentMonth ? undefined : monthDate(),
        }),
      `${fixedItem.description} registrado`,
      `Error al registrar ${fixedItem.description}`,
    );
  }

  async function handleDeleteFixedItem(id) {
    await deleteFixedItem(id);
    toast("Fijo eliminado");
  }

  async function handleUpdateFixedItem(id, payload) {
    return withToast(() => updateFixedItem(id, payload), "Fijo actualizado");
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
  useOutsideClick(pickerRef, () => setPickerOpen(false), pickerOpen);

  const [page, setPage] = useState(
    () => sessionStorage.getItem("gp_page") || "monthly",
  );
  const navigateTo = (p) => {
    sessionStorage.setItem("gp_page", p);
    setPage(p);
  };
  const [formOpen, setFormOpen] = useState(false);

  const [shell, setShell] = useState(
    () => sessionStorage.getItem("gp_shell") || "finance",
  );
  const navigateShell = (s) => {
    sessionStorage.setItem("gp_shell", s);
    setShell(s);
  };

  function closeTransactionForm() {
    setFormOpen(false);
  }

  // Months (0-indexed) in the picker year that have at least one transaction
  const monthsWithData = useMemo(() => {
    const s = new Set();
    for (const t of transactions) {
      const d = new Date(t.created_at);
      if (d.getUTCFullYear() === year) s.add(d.getUTCMonth());
    }
    return s;
  }, [transactions, year]);

  // Months with at least one transaction in status "pending"
  const monthsWithPending = useMemo(() => {
    const s = new Set();
    for (const t of transactions) {
      if (t.status === "pending") {
        const d = new Date(t.created_at);
        if (d.getUTCFullYear() === year) s.add(d.getUTCMonth());
      }
    }
    return s;
  }, [transactions, year]);

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
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {shell === "events" && (
              <button
                type="button"
                onClick={() => navigateShell("finance")}
                className="p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Volver a Gastos-Pro"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
                {shell === "events" ? "Celebraciones" : "Gastos-Pro"}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                {shell === "events"
                  ? "Cumpleaños, invitados y gastos del festejo"
                  : "Control de gastos mensuales"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-4">
            {shell === "finance" && loading && (
              <Loader2 className="w-4 h-4 text-slate-300 animate-spin flex-shrink-0" />
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {shell === "finance" && (
                <>
                  {page === "monthly" && (
                    <button
                      onClick={() => setFormOpen(true)}
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
                    onClick={() =>
                      navigateTo(page === "shopping" ? "monthly" : "shopping")
                    }
                    aria-label="Lista de compras"
                    className={`p-2 sm:p-1.5 rounded-lg transition-colors ${
                      page === "shopping"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <ShoppingCart
                      className="w-5 sm:w-4 h-5 sm:h-4"
                      strokeWidth={2}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateShell("events")}
                    aria-label="Celebraciones"
                    className="p-2 sm:p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Cake className="w-5 sm:w-4 h-5 sm:h-4" strokeWidth={2} />
                  </button>
                </>
              )}
              <button
                onClick={() => setDark((d) => !d)}
                aria-label="Cambiar tema"
                className="p-1.5 rounded-lg transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {dark ? (
                  <Sun className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <Moon className="w-4 h-4" strokeWidth={2.5} />
                )}
              </button>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-8 h-8 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                />
              )}
              <button
                onClick={signOut}
                aria-label="Cerrar sesión"
                className="p-2 sm:p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                <LogOut className="w-5 sm:w-4 h-5 sm:w-4" strokeWidth={2} />
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
            if (e.target === e.currentTarget) closeTransactionForm();
          }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeTransactionForm}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Nuevo movimiento
              </h2>
              <button
                onClick={closeTransactionForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <TransactionForm
              onAdd={(tx) => {
                handleAddTransaction(tx);
                closeTransactionForm();
              }}
              onAddInstallments={(payload, count) => {
                handleAddInstallments(payload, count);
                closeTransactionForm();
              }}
              customCategories={customCategories}
              onAddCategory={addCategory}
              userId={userId}
              transactions={transactions}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="w-full px-4 sm:px-6 py-6">
        {shell === "events" ? (
          <EventsHub userId={userId} />
        ) : (
          <>
        {/* Page tabs — hidden when on shopping page */}
        {page !== "shopping" && (
          <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {["monthly", "annual", "subs", "housekeeper"].map((p) => (
              <button
                key={p}
                onClick={() => navigateTo(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page === p
                    ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {p === "monthly"
                  ? "Mensual"
                  : p === "annual"
                    ? "Anual"
                    : p === "subs"
                      ? "Suscripciones"
                      : p === "housekeeper"
                        ? "Empleada"
                        : ""}
              </button>
            ))}
          </div>
        )}
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
        {(page === "monthly" || page === "housekeeper") && (
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
                          className={`relative py-1.5 rounded-xl text-xs font-medium transition-colors
                          ${isSelected ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                        >
                          {name}
                          {!isSelected &&
                            (monthsWithData.has(i) ||
                              monthsWithPending.has(i)) && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                                {monthsWithData.has(i) && (
                                  <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                                )}
                                {monthsWithPending.has(i) && (
                                  <span className="w-1 h-1 rounded-full bg-orange-400" />
                                )}
                              </span>
                            )}
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

        {page === "housekeeper" ? (
          <HousekeeperPage
            userId={userId}
            year={year}
            month={month}
            transactions={monthlyTransactions}
            addTransaction={addHousekeeperTransaction}
            deleteTransaction={deleteHousekeeperTransaction}
            updateTransaction={updateHousekeeperTransaction}
          />
        ) : page === "subs" ? (
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
        ) : page === "shopping" ? (
          <ShoppingListPage userId={userId} />
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
              <div className="space-y-6 order-2 lg:order-1">
                <ExpenseChart transactions={monthlyTransactions} />
                <FixedItemsPanel
                  fixedItems={fixedItems}
                  pendingItems={pendingFixedItems}
                  prevMonthTransactions={prevMonthTransactions}
                  onFill={fillFixedItem}
                  onAdd={addFixedItem}
                  onDelete={handleDeleteFixedItem}
                  onUpdate={handleUpdateFixedItem}
                  onReorder={reorderFixedItems}
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
              <div className="order-1 lg:order-2">
                {loading && transactions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 shadow-sm flex justify-center">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : (
                  <TransactionList
                    transactions={monthlyTransactions}
                    subscriptions={subscriptions.filter((s) => s.active)}
                    exchangeRate={exchangeRate}
                    year={year}
                    month={month}
                    onDelete={handleDeleteTransaction}
                    onUpdate={handleUpdateTransaction}
                    onToggleStatus={toggleStatus}
                    onDuplicate={handleDuplicate}
                    onReorder={handleReorder}
                    onDeleteMultiple={handleDeleteMultiple}
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
          </>
        )}
      </main>
    </div>
  );
}
