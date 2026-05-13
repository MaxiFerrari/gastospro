import { useState } from "react";
import { AlertCircle, Loader2, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import SummaryPanel from "./components/SummaryPanel";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const { session, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const userId = session?.user?.id ?? null;
  const { transactions, loading, error, addTransaction, deleteTransaction } =
    useTransactions(userId);

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
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
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
            {/* User avatar + logout */}
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
      <main className="max-w-2xl mx-auto px-5 py-6">
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

        {/* Summary cards */}
        <SummaryPanel transactions={transactions} />

        {/* Add transaction form */}
        <TransactionForm onAdd={addTransaction} />

        {/* Transactions list */}
        {loading && transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm flex justify-center">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={deleteTransaction}
          />
        )}
      </main>
    </div>
  );
}
