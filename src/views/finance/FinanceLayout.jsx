import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useTransactions } from "@views/finance/hooks/useTransactions";
import { useMonthFilter } from "@views/finance/hooks/useMonthFilter";
import { useMonthlyFinance } from "@views/finance/hooks/useMonthlyFinance";
import { useFixedItems } from "@views/finance/hooks/useFixedItems";
import { useCategories } from "@views/finance/hooks/useCategories";
import { useBudgets } from "@views/finance/hooks/useBudgets";
import { useSubscriptions } from "@views/finance/hooks/useSubscriptions";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useAppRoute } from "@hooks/useAppRoute";
import { useAppKeyboardShortcuts } from "@hooks/useAppKeyboardShortcuts";
import TransactionDrawer from "@components/app/TransactionDrawer";
import FinanceShell from "./FinanceShell";
import { toast, toastConfirm, withToast } from "@lib/toast";
import { buildPath, normalizePathname, rememberFinancePath } from "@lib/routes";
import { useAppChromeSetter } from "@views/shared/appChromeContext";

const PENDING_NEW_TX_KEY = "gastospro:openNewTx";

export default function FinanceLayout() {
  const { session } = useAuth();
  const route = useAppRoute();
  const location = useLocation();
  const navigate = useNavigate();
  const setAppChrome = useAppChromeSetter();
  const [formOpen, setFormOpen] = useState(false);

  const { page, year, month, pathname } = route;
  const financePage = page ?? "monthly";

  const setYearMonth = useCallback(
    (y, m) => {
      const pageForMonth =
        financePage === "housekeeper" ? "housekeeper" : "monthly";
      navigate(
        buildPath({
          mode: "finance",
          page: pageForMonth,
          year: y,
          month: m,
        }),
      );
    },
    [navigate, financePage],
  );

  const monthFilter = useMonthFilter({
    year,
    month,
    setYearMonth,
  });

  const {
    label,
    isCurrentMonth,
    goToPrev,
    goToNext,
    filterTransactions,
    ...monthNav
  } = monthFilter;

  const goToCurrentMonth = useCallback(() => {
    const n = new Date();
    setYearMonth(n.getFullYear(), n.getMonth());
  }, [setYearMonth]);

  const navigateTo = useCallback(
    (p) => {
      navigate(
        buildPath({
          mode: "finance",
          page: p,
          year,
          month,
        }),
      );
    },
    [navigate, year, month],
  );

  useEffect(() => {
    rememberFinancePath(normalizePathname(pathname));
  }, [pathname]);

  const consumedOpenTxStateRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem(PENDING_NEW_TX_KEY) === "1") {
      sessionStorage.removeItem(PENDING_NEW_TX_KEY);
      setFormOpen(true);
      return;
    }

    if (!location.state?.openNewTransaction) {
      consumedOpenTxStateRef.current = false;
      return;
    }
    if (consumedOpenTxStateRef.current) return;

    consumedOpenTxStateRef.current = true;
    setFormOpen(true);
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      { replace: true, state: {} },
    );
  }, [
    location.key,
    location.pathname,
    location.search,
    location.hash,
    location.state,
    navigate,
  ]);

  const monthNavEnabled =
    financePage === "monthly" || financePage === "housekeeper";
  const newTxShortcutEnabled = financePage === "monthly";

  useAppKeyboardShortcuts({
    enabled: Boolean(session),
    overlayOpen: formOpen,
    monthNavEnabled,
    onNewTransaction: newTxShortcutEnabled
      ? () => setFormOpen(true)
      : undefined,
    onCloseOverlay: () => setFormOpen(false),
    onPrevMonth: monthNavEnabled ? goToPrev : undefined,
    onNextMonth: monthNavEnabled ? goToNext : undefined,
  });

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
  } = useTransactions(userId, {
    year,
    month,
    page: financePage,
  });

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

  const { rate: exchangeRate, setRate: setExchangeRate, dark } =
    useUserPreferences();

  const monthlyFinance = useMonthlyFinance({
    transactions,
    fixedItems,
    filterTransactions,
    year,
    month,
    isCurrentMonth,
  });

  const { createdAtForNewTransaction } = monthlyFinance;

  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  useEffect(() => {
    if (!setAppChrome) return;
    setAppChrome({
      loading,
      page: financePage,
      formOpen,
      openForm,
      closeForm,
      monthNavEnabled,
      goToPrev: monthNavEnabled ? goToPrev : undefined,
      goToNext: monthNavEnabled ? goToNext : undefined,
    });
    return () => setAppChrome(null);
  }, [
    setAppChrome,
    loading,
    financePage,
    formOpen,
    openForm,
    closeForm,
    monthNavEnabled,
    goToPrev,
    goToNext,
  ]);

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

  return (
    <>
      <TransactionDrawer
        open={formOpen}
        onClose={closeForm}
        onAdd={handleAddTransaction}
        onAddInstallments={handleAddInstallments}
        customCategories={customCategories}
        onAddCategory={addCategory}
        userId={userId}
        transactions={transactions}
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
      />
      <FinanceShell
        page={financePage}
        onNavigateTo={navigateTo}
        error={error}
        onRetry={refetch}
        monthFilter={{
          label,
          year,
          month,
          isCurrentMonth,
          goToCurrentMonth,
          goToPrev,
          goToNext,
          ...monthNav,
        }}
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
    </>
  );
}
