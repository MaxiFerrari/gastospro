import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useMonthFilter } from "./hooks/useMonthFilter";
import { useMonthlyFinance } from "./hooks/useMonthlyFinance";
import { useFixedItems } from "./hooks/useFixedItems";
import { useCategories } from "./hooks/useCategories";
import { useBudgets } from "./hooks/useBudgets";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { useUserPreferences } from "./hooks/useUserPreferences";
import { InstallPrompt, OfflineBanner } from "./components/InstallPrompt";
import LoginScreen from "./components/LoginScreen";
import Toaster from "./components/Toaster";
import AppHeader from "./components/AppHeader";
import TransactionDrawer from "./components/TransactionDrawer";
import FinanceShell from "./components/FinanceShell";
import PageSkeleton from "./components/PageSkeleton";
import { toast, toastConfirm, withToast } from "./lib/toast";
import { parsePathname, buildPath, defaultPath } from "./lib/routes";

const EventsHub = lazy(() => import("./components/EventsHub"));

export default function App() {
  const { session, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const route = parsePathname(location.pathname);

  const setYearMonth = useCallback(
    (y, m) => {
      const pageForMonth =
        route.page === "housekeeper" ? "housekeeper" : "monthly";
      navigate(
        buildPath({
          shell: route.shell,
          page: pageForMonth,
          year: y,
          month: m,
        }),
      );
    },
    [navigate, route.shell, route.page],
  );

  const monthFilter = useMonthFilter({
    year: route.year,
    month: route.month,
    setYearMonth,
  });

  const {
    label,
    isCurrentMonth,
    year,
    month,
    filterTransactions,
    ...monthNav
  } = monthFilter;

  const page = route.page;
  const shell = route.shell;

  const navigateTo = useCallback(
    (p) => {
      navigate(
        buildPath({
          shell: "finance",
          page: p,
          year,
          month,
        }),
      );
    },
    [navigate, year, month],
  );

  const navigateShell = useCallback(
    (s) => {
      navigate(
        buildPath({
          shell: s,
          page: s === "events" ? "monthly" : page,
          year,
          month,
        }),
      );
    },
    [navigate, page, year, month],
  );

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      navigate(defaultPath(), { replace: true });
    }
  }, [location.pathname, navigate]);

  const userId = session?.user?.id ?? null;

  const {
    transactions,
    loading,
    error,
    refetch,
    addTransaction,
    addInstallments,
    deleteTransaction,
    updateTransaction,
    toggleStatus,
    reorderTransactions,
  } = useTransactions(userId, { year, month, page });

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

  const monthlyFinance = useMonthlyFinance({
    transactions,
    fixedItems,
    filterTransactions,
    year,
    month,
    isCurrentMonth,
  });

  const { createdAtForNewTransaction } = monthlyFinance;

  async function handleAddTransaction(payload) {
    return withToast(
      () =>
        addTransaction({
          ...payload,
          created_at: createdAtForNewTransaction(payload.exclude_from_totals),
        }),
      "Movimiento agregado",
      "Error al guardar el movimiento",
    );
  }

  async function addHousekeeperTransaction(payload) {
    return addTransaction(payload);
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
      created_at: createdAtForNewTransaction(transaction.exclude_from_totals),
    };
    return withToast(
      () => addTransaction(dup),
      "Duplicado",
      "Error al duplicar",
    );
  }

  async function handleDeleteMultiple(ids) {
    if (!ids.length) return;
    const msg =
      ids.length === 1 ? "1 movimiento" : `${ids.length} movimientos`;
    toastConfirm(`¿Eliminar ${msg}?`, async () => {
      await Promise.all(ids.map((id) => deleteTransaction(id)));
      toast(`${msg} eliminado${ids.length > 1 ? "s" : ""}`);
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
          created_at: createdAtForNewTransaction(false),
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
    await reorderTransactions(newOrder.map((t) => t.id));
    const fixedInOrder = newOrder.filter((t) => t.fixed_item_id != null);
    if (fixedInOrder.length > 0) {
      await reorderFixedItems(fixedInOrder.map((t) => t.fixed_item_id));
    }
  }

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

  if (location.pathname === "/" || location.pathname === "") {
    return null;
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
      <TransactionDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onAdd={handleAddTransaction}
        onAddInstallments={handleAddInstallments}
        customCategories={customCategories}
        onAddCategory={addCategory}
        userId={userId}
        transactions={transactions}
      />

      <main className="w-full px-4 sm:px-6 py-6">
        {shell === "events" ? (
          <Suspense fallback={<PageSkeleton label="Celebraciones" />}>
            <EventsHub userId={userId} />
          </Suspense>
        ) : (
          <FinanceShell
            page={page}
            onNavigateTo={navigateTo}
            error={error}
            onRetry={refetch}
            monthFilter={{ label, year, month, ...monthNav }}
            transactions={transactions}
            transactionsLoading={loading}
            monthlyFinance={monthlyFinance}
            fixedItems={fixedItems}
            budgets={budgets}
            subscriptions={subscriptions}
            exchangeRate={exchangeRate}
            customCategories={customCategories}
            userId={userId}
            dark={dark}
            onSetExchangeRate={setExchangeRate}
            onAddCategory={addCategory}
            onAddFixedItem={addFixedItem}
            onDeleteFixedItem={handleDeleteFixedItem}
            onUpdateFixedItem={handleUpdateFixedItem}
            onReorderFixedItems={reorderFixedItems}
            onUpsertBudget={upsertBudget}
            onDeleteBudget={deleteBudget}
            onAddSubscription={addSubscription}
            onUpdateSubscription={updateSubscription}
            onDeleteSubscription={deleteSubscription}
            onToggleSubscription={toggleSubscription}
            onFillFixedItem={fillFixedItem}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onToggleStatus={toggleStatus}
            onDuplicate={handleDuplicate}
            onReorder={handleReorder}
            onDeleteMultiple={handleDeleteMultiple}
            onAddHousekeeperTransaction={addHousekeeperTransaction}
            onDeleteHousekeeperTransaction={deleteTransaction}
            onUpdateHousekeeperTransaction={updateTransaction}
          />
        )}
      </main>
    </div>
  );
}
