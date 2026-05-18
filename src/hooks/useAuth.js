import { useState, useEffect } from "react";
import { supabase } from "@lib/supabaseClient";
import { getAuthRedirectUrl } from "@lib/authRedirect";

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () => {
    const redirectTo = getAuthRedirectUrl();
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : {},
    });
  };

  const signOut = () => supabase.auth.signOut();

  return { session, signInWithGoogle, signOut };
}
