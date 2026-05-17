import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/LoginScreen";
import AppRouter from "./routing/AppRouter";

export default function App() {
  const { session, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

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

  return <AppRouter />;
}
