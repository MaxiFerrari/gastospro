/**
 * URL de retorno tras OAuth (Google vía Supabase).
 * Debe coincidir con una entrada en Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthRedirectUrl() {
  const configured = import.meta.env.VITE_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}
