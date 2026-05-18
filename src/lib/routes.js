import { getDefaultHubMode } from "./lifeHub.js";
import {
  DEFAULT_SHOPPING_CONTEXT,
  isValidShoppingContext,
} from "./shoppingContexts.js";

const now = () => new Date();

/** @typedef {'monthly'|'annual'|'subs'|'housekeeper'} FinancePageId */
/** @typedef {'finance'|'shopping'|'events'|'home'|'me'} HubMode */
/** @typedef {'hub'|'calendario'} EventsSubPage */
/** @typedef {'hub'|'mascotas'} HomeSubPage */
/** @typedef {'hub'|'privacidad'|'cuenta'} MeSubPage */

export const EVENTS_HUB_PATH = "/eventos";
export const EVENTS_CALENDAR_PATH = "/eventos/calendario";
export const HOME_HUB_PATH = "/hogar";
export const HOME_PETS_PATH = "/hogar/mascotas";
export const ME_HUB_PATH = "/yo";
export const ME_PRIVACIDAD_PATH = "/yo/privacidad";
export const ME_CUENTA_PATH = "/yo/cuenta";

/**
 * @typedef {object} AppRoute
 * @property {HubMode} mode
 * @property {FinancePageId} [page]
 * @property {number} year
 * @property {number} month
 * @property {string} [shoppingContext]
 * @property {boolean} [supermarketMode]
 * @property {boolean} [openForm]
 * @property {EventsSubPage} [eventsSubPage]
 * @property {HomeSubPage} [homeSubPage]
 * @property {MeSubPage} [meSubPage]
 */

/**
 * @param {string} pathname
 * @returns {AppRoute | null}
 */
export function parsePathname(pathname) {
  const n = now();
  const defaultYear = n.getFullYear();
  const defaultMonth = n.getMonth();
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);

  const financeDefaults = {
    mode: /** @type {const} */ ("finance"),
    page: /** @type {const} */ ("monthly"),
    year: defaultYear,
    month: defaultMonth,
  };

  if (parts.length === 0) {
    return { ...financeDefaults };
  }

  if (parts[0] === "nuevo-gasto") {
    return {
      ...financeDefaults,
      openForm: true,
    };
  }

  if (parts[0] === "lista-super") {
    return {
      mode: "shopping",
      year: defaultYear,
      month: defaultMonth,
      shoppingContext: DEFAULT_SHOPPING_CONTEXT,
      supermarketMode: true,
    };
  }

  if (parts[0] === "hogar") {
    const homeSubPage = parts[1] === "mascotas" ? "mascotas" : "hub";
    return { mode: "home", homeSubPage, year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "yo") {
    let meSubPage = "hub";
    if (parts[1] === "privacidad") meSubPage = "privacidad";
    if (parts[1] === "cuenta") meSubPage = "cuenta";
    return { mode: "me", meSubPage, year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "eventos") {
    const eventsSubPage = parts[1] === "calendario" ? "calendario" : "hub";
    return { mode: "events", eventsSubPage, year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "compras") {
    const ctx =
      parts[1] && isValidShoppingContext(parts[1])
        ? parts[1]
        : undefined;
    const modo = parts[2] === "modo" || (parts[1] === "modo" && !ctx);
    return {
      mode: "shopping",
      year: defaultYear,
      month: defaultMonth,
      shoppingContext: ctx,
      supermarketMode: modo,
    };
  }

  if (parts[0] === "anual") {
    return {
      mode: "finance",
      page: "annual",
      year: defaultYear,
      month: defaultMonth,
    };
  }

  if (parts[0] === "suscripciones") {
    return {
      mode: "finance",
      page: "subs",
      year: defaultYear,
      month: defaultMonth,
    };
  }

  if (parts[0] === "empleada") {
    const year = parts[1] ? parseYear(parts[1], defaultYear) : defaultYear;
    const month = parts[2] ? parseMonth(parts[2], defaultMonth) : defaultMonth;
    return {
      mode: "finance",
      page: "housekeeper",
      year,
      month,
    };
  }

  if (parts[0] === "mensual") {
    const year = parts[1] ? parseYear(parts[1], defaultYear) : defaultYear;
    const month = parts[2] ? parseMonth(parts[2], defaultMonth) : defaultMonth;
    return {
      mode: "finance",
      page: "monthly",
      year,
      month,
    };
  }

  return null;
}

function parseYear(raw, fallback) {
  const y = parseInt(raw, 10);
  return Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : fallback;
}

/** URL month is 1–12; internal month is 0–11. */
function parseMonth(raw, fallback) {
  const m = parseInt(raw, 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return fallback;
  return m - 1;
}

/**
 * @param {Partial<AppRoute> & { mode: HubMode }} route
 */
export function buildPath(route) {
  const { mode, year, month } = route;
  const page = route.page ?? "monthly";

  if (mode === "home") {
    return route.homeSubPage === "mascotas" ? HOME_PETS_PATH : HOME_HUB_PATH;
  }
  if (mode === "me") {
    if (route.meSubPage === "privacidad") return ME_PRIVACIDAD_PATH;
    if (route.meSubPage === "cuenta") return ME_CUENTA_PATH;
    return ME_HUB_PATH;
  }
  if (mode === "events") {
    return route.eventsSubPage === "calendario"
      ? EVENTS_CALENDAR_PATH
      : EVENTS_HUB_PATH;
  }
  if (mode === "shopping") {
    const ctx = route.shoppingContext;
    if (route.supermarketMode) {
      return ctx ? `/compras/${ctx}/modo` : "/compras/modo";
    }
    return ctx ? `/compras/${ctx}` : "/compras";
  }

  if (page === "annual") return "/anual";
  if (page === "subs") return "/suscripciones";
  if (page === "housekeeper") return `/empleada/${year}/${month + 1}`;
  return `/mensual/${year}/${month + 1}`;
}

export function defaultPath() {
  const mode = getDefaultHubMode();
  const n = now();
  if (mode === "shopping") {
    return buildPath({
      mode: "shopping",
      year: n.getFullYear(),
      month: n.getMonth(),
      shoppingContext: DEFAULT_SHOPPING_CONTEXT,
    });
  }
  if (mode === "events") return "/eventos";
  if (mode === "home") return "/hogar";
  if (mode === "me") return "/yo";
  return buildPath({
    mode: "finance",
    page: "monthly",
    year: n.getFullYear(),
    month: n.getMonth(),
  });
}

/** PWA shortcut / deep link: open new-transaction flow on current month. */
export const NEW_TRANSACTION_PATH = "/nuevo-gasto";

export const SUPER_LIST_PATH = "/lista-super";

export function currentMonthPath(page = "monthly") {
  const n = now();
  return buildPath({
    mode: "finance",
    page,
    year: n.getFullYear(),
    month: n.getMonth(),
  });
}

/** @deprecated use route.mode === 'events' */
export function routeIsEvents(route) {
  return route.mode === "events";
}

export function normalizePathname(pathname) {
  const p = pathname.replace(/\/$/, "");
  return p || "/";
}

const KNOWN_PREFIXES = [
  "/mensual",
  "/empleada",
  "/anual",
  "/suscripciones",
  "/compras",
  "/eventos",
  "/hogar",
  "/yo",
  "/nuevo-gasto",
  "/lista-super",
];

export function isKnownAppPath(pathname) {
  const p = normalizePathname(pathname);
  if (p === "/") return true;
  return KNOWN_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

const LAST_FINANCE_PATH_KEY = "gastospro:lastFinancePath";

export function rememberFinancePath(pathname) {
  const p = normalizePathname(pathname);
  if (!isKnownAppPath(p)) return;
  const route = parsePathname(p);
  if (!route || route.mode !== "finance") return;
  try {
    sessionStorage.setItem(LAST_FINANCE_PATH_KEY, normalizePathname(pathname));
  } catch {
    /* quota */
  }
}

export function getLastFinancePath() {
  try {
    const stored = sessionStorage.getItem(LAST_FINANCE_PATH_KEY);
    const parsed = stored ? parsePathname(stored) : null;
    if (stored && isKnownAppPath(stored) && parsed?.mode === "finance") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  const n = now();
  return buildPath({
    mode: "finance",
    page: "monthly",
    year: n.getFullYear(),
    month: n.getMonth(),
  });
}

/**
 * @param {{ mode: HubMode, page?: FinancePageId, year: number, month: number, pathname: string }} ctx
 */
export function getHubPaths({ mode, page, year, month, pathname }) {
  const financePath =
    mode === "finance"
      ? normalizePathname(pathname)
      : getLastFinancePath();

  return {
    finance: financePath,
    shopping: buildPath({
      mode: "shopping",
      shoppingContext: DEFAULT_SHOPPING_CONTEXT,
    }),
    events: "/eventos",
    home: "/hogar",
    me: "/yo",
  };
}

/** @param {HubMode} tabId */
export function isHubTabActive(tabId, pathname) {
  const p = normalizePathname(pathname);
  if (tabId === "finance") {
    return (
      p.startsWith("/mensual") ||
      p.startsWith("/empleada") ||
      p === "/anual" ||
      p === "/suscripciones"
    );
  }
  if (tabId === "shopping") {
    return p.startsWith("/compras") || p === "/lista-super";
  }
  if (tabId === "events") return p.startsWith("/eventos");
  if (tabId === "home") return p.startsWith("/hogar");
  if (tabId === "me") return p.startsWith("/yo");
  return false;
}
