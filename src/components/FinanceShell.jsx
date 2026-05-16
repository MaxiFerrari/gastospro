import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import MonthPicker from "./MonthPicker";
import SummaryPanel from "./SummaryPanel";
import ExpenseChart from "./ExpenseChart";
import FixedItemsPanel from "./FixedItemsPanel";
import BudgetPanel from "./BudgetPanel";
import TransactionList from "./TransactionList";
import MonthComparisonPanel from "./MonthComparisonPanel";
import AnnualView from "./AnnualView";
import SubscriptionsPage from "./SubscriptionsPage";
import ShoppingListPage from "./ShoppingListPage";
import HousekeeperPage from "./HousekeeperPage";
import { toast } from "../lib/toast";

const PAGE_TABS = [
  { id: "monthly", label: "Mensual" },
  { id: "annual", label: "Anual" },
  { id: "subs", label: "Suscripciones" },
  { id: "housekeeper", label: "Empleada" },
];

export default function FinanceShell({
  page,
  onNavigateTo,
  error,
  onRetry,
  monthFilter,
  transactions,
  transactionsLoading,
  monthlyFinance,
  fixedItems,
  budgets,
  subscriptions,
  exchangeRate,
  customCategories,
  userId,
  dark,
  onSetExchangeRate,
  onAddCategory,
  onAddFixedItem,
  onDeleteFixedItem,
  onUpdateFixedItem,
  onReorderFixedItems,
  onUpsertBudget,
  onDeleteBudget,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  onToggleSubscription,
  onFillFixedItem,
  onDeleteTransaction,
  onUpdateTransaction,
  onToggleStatus,
  onDuplicate,
  onReorder,
  onDeleteMultiple,
  onAddHousekeeperTransaction,
  onDeleteHousekeeperTransaction,
  onUpdateHousekeeperTransaction,
}) {
  const {
    label,
    year,
    month,
    goToPrev,
    goToNext,
    goToMonth,
    pickerPrevYear,
    pickerNextYear,
  } = monthFilter;

  const {
    monthlyTransactions,
    prevMonthTransactions,
    pendingFixedItems,
    pendingFixedExpenses,
    pendingExpenseFixedCount,
  } = monthlyFinance;

  return (
    <>
      {page !== "shopping" && (
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {PAGE_TABS.map(({ id, label: tabLabel }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigateTo(id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === id
                  ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>
      )}

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
            type="button"
            onClick={onRetry}
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
          addTransaction={onAddHousekeeperTransaction}
          deleteTransaction={onDeleteHousekeeperTransaction}
          updateTransaction={onUpdateHousekeeperTransaction}
        />
      ) : page === "subs" ? (
        <SubscriptionsPage
          subscriptions={subscriptions}
          fixedItems={fixedItems}
          exchangeRate={exchangeRate}
          onSetRate={onSetExchangeRate}
          onAdd={onAddSubscription}
          onUpdate={onUpdateSubscription}
          onDelete={onDeleteSubscription}
          onToggle={onToggleSubscription}
        />
      ) : page === "annual" ? (
        <AnnualView transactions={transactions} dark={dark} />
      ) : page === "shopping" ? (
        <ShoppingListPage userId={userId} />
      ) : (
        <>
          <SummaryPanel
            transactions={monthlyTransactions}
            prevTransactions={prevMonthTransactions}
            pendingFixedExpenses={pendingFixedExpenses}
            pendingExpenseFixedCount={pendingExpenseFixedCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6 order-2 lg:order-1">
              <ExpenseChart transactions={monthlyTransactions} />
              <FixedItemsPanel
                fixedItems={fixedItems}
                pendingItems={pendingFixedItems}
                prevMonthTransactions={prevMonthTransactions}
                onFill={onFillFixedItem}
                onAdd={onAddFixedItem}
                onDelete={onDeleteFixedItem}
                onUpdate={onUpdateFixedItem}
                onReorder={onReorderFixedItems}
                customCategories={customCategories}
                onAddCategory={onAddCategory}
              />
              <BudgetPanel
                transactions={monthlyTransactions}
                budgets={budgets}
                onSave={async (cat, amount) => {
                  const r = await onUpsertBudget(cat, amount);
                  if (r?.error) toast("Error al guardar presupuesto", "error");
                }}
                onDelete={onDeleteBudget}
              />
            </div>

            <div className="order-1 lg:order-2">
              {transactionsLoading && transactions.length === 0 ? (
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
                  onDelete={onDeleteTransaction}
                  onUpdate={onUpdateTransaction}
                  onToggleStatus={onToggleStatus}
                  onDuplicate={onDuplicate}
                  onReorder={onReorder}
                  onDeleteMultiple={onDeleteMultiple}
                />
              )}
            </div>
          </div>

          <MonthComparisonPanel
            transactions={monthlyTransactions}
            prevTransactions={prevMonthTransactions}
          />
        </>
      )}
    </>
  );
}
