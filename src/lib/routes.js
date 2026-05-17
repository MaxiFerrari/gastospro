const now = () => new Date();

/** @typedef {'monthly'|'annual'|'subs'|'housekeeper'|'shopping'} PageId */
/** @typedef {'finance'|'events'} ShellId */

/**
 * @param {string} pathname
 * @returns {{ shell: ShellId, page: PageId, year: number, month: number }}
 */
export function parsePathname(pathname) {
  const n = now();
  const defaultYear = n.getFullYear();
  const defaultMonth = n.getMonth();
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);

  if (parts.length === 0) {
    return { shell: "finance", page: "monthly", year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "nuevo-gasto") {
    return {
      shell: "finance",
      page: "monthly",
      year: defaultYear,
      month: defaultMonth,
      openForm: true,
    };
  }

  if (parts[0] === "eventos") {
    return { shell: "events", page: "monthly", year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "compras") {
    return { shell: "finance", page: "shopping", year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "anual") {
    return { shell: "finance", page: "annual", year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "suscripciones") {
    return { shell: "finance", page: "subs", year: defaultYear, month: defaultMonth };
  }

  if (parts[0] === "empleada") {
    const year = parts[1] ? parseYear(parts[1], defaultYear) : defaultYear;
    const month = parts[2] ? parseMonth(parts[2], defaultMonth) : defaultMonth;
    return { shell: "finance", page: "housekeeper", year, month };
  }

  if (parts[0] === "mensual") {
    const year = parts[1] ? parseYear(parts[1], defaultYear) : defaultYear;
    const month = parts[2] ? parseMonth(parts[2], defaultMonth) : defaultMonth;
    return { shell: "finance", page: "monthly", year, month };
  }

  return { shell: "finance", page: "monthly", year: defaultYear, month: defaultMonth };
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
 * @param {{ shell: ShellId, page: PageId, year: number, month: number }} route
 */
export function buildPath({ shell, page, year, month }) {
  if (shell === "events") return "/eventos";
  if (page === "shopping") return "/compras";
  if (page === "annual") return "/anual";
  if (page === "subs") return "/suscripciones";
  if (page === "housekeeper") return `/empleada/${year}/${month + 1}`;
  return `/mensual/${year}/${month + 1}`;
}

export function defaultPath() {
  const n = now();
  return buildPath({
    shell: "finance",
    page: "monthly",
    year: n.getFullYear(),
    month: n.getMonth(),
  });
}

/** PWA shortcut / deep link: open new-transaction flow on current month. */
export const NEW_TRANSACTION_PATH = "/nuevo-gasto";

export function currentMonthPath(page = "monthly") {
  const n = now();
  return buildPath({
    shell: "finance",
    page,
    year: n.getFullYear(),
    month: n.getMonth(),
  });
}
