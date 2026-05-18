import { useState, useEffect } from "react";
import { Download, X, WifiOff } from "lucide-react";

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-3.5 shadow-lg">
      <div className="flex-shrink-0 rounded-xl bg-violet-600 p-2">
        <Download className="h-5 w-5 text-white" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">Instalar GastosPro</p>
        <p className="text-xs text-slate-400">Accedé desde tu pantalla de inicio</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onInstall}
          className="touch-target rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="btn-icon flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/**
 * @param {{ placement?: 'inline' | 'floating' }} props
 * inline = above bottom nav (mobile), no overlay on content
 */
export function InstallPrompt({ placement = "floating" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("pwa-install-dismissed") === "true",
  );

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setDeferredPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function install() {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  }

  const banner = (
    <InstallBanner onInstall={install} onDismiss={dismiss} />
  );

  if (placement === "inline") {
    return <div className="shrink-0 px-3 pb-2 sm:hidden">{banner}</div>;
  }

  return (
    <div className="app-floating-bottom fixed left-3 right-3 z-[90] hidden sm:block sm:left-auto sm:right-4 sm:bottom-4 sm:w-80">
      {banner}
    </div>
  );
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-gp-pending px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-sm font-medium text-white shadow-lg">
      <WifiOff className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
      Sin conexión — mostrando datos guardados
    </div>
  );
}
