import { useState, useEffect } from "react";
import { Download, X, WifiOff } from "lucide-react";

// Install banner — shown when browser fires beforeinstallprompt (Chrome/Edge/Android)
// On iOS, the prompt is not available; user must use "Add to Home Screen" manually.
export function InstallPrompt() {
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
    // Once installed, hide the banner
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

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
      <div className="flex-shrink-0 bg-violet-600 p-2 rounded-xl">
        <Download className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">Instalar GastosPro</p>
        <p className="text-xs text-slate-400">Accedé desde tu pantalla de inicio</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={install}
          className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// Offline banner — shown at the top when network is lost
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
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
      <WifiOff className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
      Sin conexión — mostrando datos guardados
    </div>
  );
}
