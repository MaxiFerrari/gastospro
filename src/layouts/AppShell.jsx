import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import {
  UserPreferencesProvider,
  useUserPreferences,
} from "@/contexts/UserPreferencesContext";
import { useAppRoute } from "@hooks/useAppRoute";
import { InstallPrompt, OfflineBanner } from "@components/app/InstallPrompt";
import Toaster from "@components/app/Toaster";
import AppHeader from "@components/app/AppHeader";
import HubNav from "@components/app/HubNav";
import { normalizePathname, getHubPaths } from "@lib/routes";
import { AppChromeContext } from "@views/shared/appChromeContext";

export default function AppShell() {
  const { session, signOut } = useAuth();
  const route = useAppRoute();
  const [appChrome, setAppChrome] = useState(null);

  const { mode, page, year, month, pathname } = route;
  const financePage = page ?? "monthly";

  const hubPaths = getHubPaths({
    mode,
    page: financePage,
    year,
    month,
    pathname: normalizePathname(pathname),
  });

  const user = session?.user;
  const userId = session?.user?.id ?? null;

  const isFinance = mode === "finance";
  const chromeOverlayOpen = Boolean(isFinance && appChrome?.formOpen);
  const compactMainPad =
    mode === "me" || mode === "home" || mode === "events";

  return (
    <UserPreferencesProvider userId={userId}>
      <AppChromeContext.Provider value={setAppChrome}>
        <AppShellFrame
          route={route}
          mode={mode}
          isFinance={isFinance}
          appChrome={appChrome}
          financePage={financePage}
          chromeOverlayOpen={chromeOverlayOpen}
          compactMainPad={compactMainPad}
          hubPaths={hubPaths}
          user={user}
          signOut={signOut}
          pathname={pathname}
        />
      </AppChromeContext.Provider>
    </UserPreferencesProvider>
  );
}

function AppShellFrame({
  route,
  mode,
  isFinance,
  appChrome,
  financePage,
  chromeOverlayOpen,
  compactMainPad,
  hubPaths,
  user,
  signOut,
  pathname,
}) {
  const { dark, setDark } = useUserPreferences();

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50 dark:bg-slate-900">
      <OfflineBanner />
      <Toaster />
      <AppHeader
        mode={mode}
        page={isFinance ? (appChrome?.page ?? financePage) : financePage}
        loading={isFinance ? (appChrome?.loading ?? false) : false}
        dark={dark}
        user={user}
        onOpenForm={isFinance && appChrome ? appChrome.openForm : undefined}
        onToggleDark={() => setDark((d) => !d)}
        onSignOut={signOut}
      />

      <main
        key={pathname}
        className={`app-main-pad w-full min-w-0 max-w-full py-3 sm:py-6 ${
          compactMainPad ? "px-0 sm:px-6" : "px-3 sm:px-6"
        }`}
      >
        <Outlet />
      </main>

      {!route.supermarketMode && !chromeOverlayOpen && (
        <>
          <InstallPrompt placement="inline" />
          <InstallPrompt placement="floating" />
        </>
      )}
      {!route.supermarketMode && !chromeOverlayOpen && (
        <HubNav paths={hubPaths} />
      )}
    </div>
  );
}
