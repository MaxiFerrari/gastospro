import { useState, useRef, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useMonthFilter } from "./hooks/useMonthFilter";
import { useFixedItems } from "./hooks/useFixedItems";
import SummaryPanel from "./components/SummaryPanel";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import ExpenseChart from "./components/ExpenseChart";
import FixedItemsPanel from "./components/FixedItemsPanel";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const { session, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const userId = session?.user?.id ?? null;
  const {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    updateTransaction,
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

  const { fixedItems, addFixedItem, deleteFixedItem, reorderFixedItems } =
    useFixedItems(userId);

  // Sort: fixed-item transactions by fixed_item sort_order first, then regular by sort_order/created_at
  const sortedMonthlyTransactions = useMemo(() => {
    const fixedMap = new Map(fixedItems.map((fi) => [fi.id, fi]));
    return [...filterTransactions(transactions)].sort((a, b) => {
      const fiA = a.fixed_item_id ? fixedMap.get(a.fixed_item_id) : null;
      const fiB = b.fixed_item_id ? fixedMap.get(b.fixed_item_id) : null;
      // Both are fixed items: sort by fixed_item.sort_order
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

  // Fixed items that have no transaction for this month yet
  const pendingFixedItems = fixedItems.filter(
    (fi) => !monthlyTransactions.some((t) => t.fixed_item_id === fi.id),
  );

  // Returns a date string set to the 15th of the selected month at noon UTC
  // to avoid timezone edge cases and ensure correct month filtering
  function monthDate() {
    return new Date(Date.UTC(year, month, 15, 12, 0, 0)).toISOString();
  }

  async function handleAddTransaction(payload) {
    return addTransaction({
      ...payload,
      created_at: isCurrentMonth ? undefined : monthDate(),
    });
  }

  async function fillFixedItem(fixedItem, amount) {
    const fixedIndex = fixedItems.findIndex((fi) => fi.id === fixedItem.id);
    await addTransaction({
      description: fixedItem.description,
      category: fixedItem.category,
      type: fixedItem.type,
      amount,
      fixed_item_id: fixedItem.id,
      sort_order: fixedIndex,
      created_at: isCurrentMonth ? undefined : monthDate(),
    });
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              GastosPro
            </h1>
            <p className="text-xs text-slate-400">
              Control de gastos mensuales
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
            )}
            <div className="flex items-center gap-2">
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
                className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-6 py-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
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

        {/* Month navigator with picker */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            onClick={goToPrev}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Clickable label opens picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="text-sm font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {label.charAt(0).toUpperCase() + label.slice(1)} ▾
            </button>

            {/* Month picker dropdown */}
            {pickerOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-64">
                {/* Year navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={pickerPrevYear}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <span className="text-sm font-bold text-slate-700">
                    {year}
                  </span>
                  <button
                    onClick={pickerNextYear}
                    disabled={year >= now.getFullYear()}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-4 gap-1">
                  {MONTHS_ES.map((name, i) => {
                    const isFuture =
                      year > now.getFullYear() ||
                      (year === now.getFullYear() && i > now.getMonth());
                    const isSelected = i === month && year === year;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          goToMonth(i, year);
                          setPickerOpen(false);
                        }}
                        disabled={isFuture}
                        className={`py-1.5 rounded-xl text-xs font-medium transition-colors
                          ${isSelected ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}
                          disabled:opacity-30 disabled:pointer-events-none`}
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
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Summary cards */}
        <SummaryPanel transactions={monthlyTransactions} />

        {/* Two-column layout on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <ExpenseChart transactions={monthlyTransactions} />
            <FixedItemsPanel
              fixedItems={fixedItems}
              pendingItems={pendingFixedItems}
              onFill={fillFixedItem}
              onAdd={addFixedItem}
              onDelete={deleteFixedItem}
            />
            <TransactionForm onAdd={handleAddTransaction} />
          </div>

          {/* Right column */}
          <div>
            {loading && transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 shadow-sm flex justify-center">
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
              </div>
            ) : (
              <TransactionList
                transactions={monthlyTransactions}
                onDelete={deleteTransaction}
                onUpdate={updateTransaction}
                onReorder={handleReorder}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
