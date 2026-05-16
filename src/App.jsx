import { useState, useMemo } from "react";
import { AlertCircle, Loader2, RefreshCw, X } from "lucide-react";
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
import AppHeader from "./components/AppHeader";
import MonthPicker from "./components/MonthPicker";

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
      <AppHeader
        shell={shell}
        page={page}
        loading={loading}
        dark={dark}
        user={user}
        onNavigateShell={navigateShell}
        onNavigateTo={navigateTo}
        onOpenForm={() => setFormOpen(true)}
        onToggleDark={() => setDark((d) => !d)}
        onSignOut={signOut}
      />
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
          <div className="bg-gp-expense-surface dark:bg-gp-expense-surface-dark border border-gp-danger/25 dark:border-gp-danger/40 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gp-expense-text flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gp-danger dark:text-gp-expense-text">
                Error al cargar datos
              </p>
              <p className="text-xs text-gp-danger mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto flex-shrink-0 text-gp-expense-text hover:text-gp-expense-hover"
              aria-label="Reintentar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {(page === "monthly" || page === "housekeeper") && (
          <MonthPicker
            label={label}
            year={year}
            month={month}
            transactions={transactions}
            goToPrev={goToPrev}
            goToNext={goToNext}
            goToMonth={goToMonth}
            pickerPrevYear={pickerPrevYear}
            pickerNextYear={pickerNextYear}
          />
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
