import { useMemo } from "react";
import { useLocation, useMatches } from "react-router-dom";
import { isValidShoppingContext } from "@lib/shoppingContexts";

function parseYear(raw, fallback) {
  const y = parseInt(raw, 10);
  return Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : fallback;
}

/** URL month 1–12 → internal 0–11 */
function parseMonth(raw, fallback) {
  const m = parseInt(raw, 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return fallback;
  return m - 1;
}

function parseShoppingFromPathname(pathname) {
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts[0] !== "compras") {
    return { shoppingContext: undefined, supermarketMode: false };
  }

  const p1 = parts[1];
  const p2 = parts[2];

  if (p1 === "modo") {
    return { shoppingContext: undefined, supermarketMode: true };
  }
  if (p1 && isValidShoppingContext(p1)) {
    return {
      shoppingContext: p1,
      supermarketMode: p2 === "modo",
    };
  }
  return { shoppingContext: undefined, supermarketMode: false };
}

/**
 * Route state from React Router matches (single source of truth).
 */
export function useAppRoute() {
  const location = useLocation();
  const matches = useMatches();

  return useMemo(() => {
    const n = new Date();
    const handleMatch = [...matches].reverse().find((m) => m.handle?.mode);
    const handle = handleMatch?.handle;
    if (!handle?.mode) {
      return {
        mode: null,
        page: "monthly",
        year: n.getFullYear(),
        month: n.getMonth(),
        shoppingContext: undefined,
        supermarketMode: false,
        pathname: location.pathname,
      };
    }

    let year = n.getFullYear();
    let month = n.getMonth();

    const ymMatch = matches.find((m) => m.params?.year != null && m.params?.month != null);
    if (ymMatch?.params) {
      year = parseYear(ymMatch.params.year, year);
      month = parseMonth(ymMatch.params.month, month);
    }

    const shopping = parseShoppingFromPathname(location.pathname);

    return {
      mode: /** @type {import('../lib/routes').HubMode} */ (handle.mode),
      page: handle.page ?? "monthly",
      eventsSubPage: handle.eventsSubPage ?? "hub",
      homeSubPage: handle.homeSubPage ?? "hub",
      meSubPage: handle.meSubPage ?? "hub",
      year,
      month,
      shoppingContext: shopping.shoppingContext,
      supermarketMode: Boolean(handle.supermarketMode ?? shopping.supermarketMode),
      pathname: location.pathname,
    };
  }, [matches, location.pathname]);
}
