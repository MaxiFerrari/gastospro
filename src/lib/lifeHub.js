/** @typedef {'finance'|'shopping'|'events'|'home'|'me'} HubMode */

export const HUB_MODES = /** @type {const} */ ([
  "finance",
  "shopping",
  "events",
  "home",
  "me",
]);

/** @type {{ id: HubMode, label: string, shortLabel: string }}[] */
export const HUB_NAV = [
  { id: "finance", label: "Finanzas", shortLabel: "Finanzas" },
  { id: "shopping", label: "Compras", shortLabel: "Compras" },
  { id: "events", label: "Celebraciones", shortLabel: "Fiestas" },
  { id: "home", label: "Hogar", shortLabel: "Hogar" },
  { id: "me", label: "Inicio", shortLabel: "Inicio" },
];

const DEFAULT_MODE_KEY = "gastospro:defaultHubMode";

/** @returns {HubMode} */
export function getDefaultHubMode() {
  try {
    const v = localStorage.getItem(DEFAULT_MODE_KEY);
    if (v && HUB_MODES.includes(/** @type {HubMode} */ (v))) return /** @type {HubMode} */ (v);
  } catch {
    /* ignore */
  }
  return "finance";
}

/** @param {HubMode} mode */
export function setDefaultHubMode(mode) {
  localStorage.setItem(DEFAULT_MODE_KEY, mode);
}

/** @param {HubMode} mode */
export function hubModeTitle(mode) {
  const row = HUB_NAV.find((m) => m.id === mode);
  return row?.label ?? "Life Pro";
}

/** @param {HubMode} mode */
export function hubModeSubtitle(mode) {
  switch (mode) {
    case "finance":
      return "Control de gastos mensuales";
    case "shopping":
      return "Listas por contexto e inventario";
    case "events":
      return "Cumpleaños, invitados y festejo";
    case "home":
      return "Tareas del hogar y quién hace qué";
    case "me":
      return "Tu casa, próximo evento y ajustes";
    default:
      return "";
  }
}
