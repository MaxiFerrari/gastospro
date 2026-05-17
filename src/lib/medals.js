import {
  medalsUnlockedKey,
  supermarketCheckCountKey,
} from "./appPreferences";

/** @typedef {{ id: string; emoji: string; title: string; desc: string }} MedalDef */

/** @type {MedalDef[]} */
export const MEDAL_DEFINITIONS = [
  {
    id: "first_event",
    emoji: "🎂",
    title: "Anfitrión",
    desc: "Creaste tu primer evento",
  },
  {
    id: "event_soon",
    emoji: "📅",
    title: "En la agenda",
    desc: "Tenés un evento en los próximos 7 días",
  },
  {
    id: "home_tasks_5",
    emoji: "🏠",
    title: "Hogar al día",
    desc: "Completaste 5 tareas del hogar",
  },
  {
    id: "super_10",
    emoji: "🛒",
    title: "Pasillo pro",
    desc: "Tachaste 10 ítems en modo supermercado",
  },
  {
    id: "list_clear",
    emoji: "✨",
    title: "Lista vacía",
    desc: "Completaste una lista en modo supermercado",
  },
  {
    id: "backup_once",
    emoji: "☁️",
    title: "Respaldo",
    desc: "Exportaste tus datos al menos una vez",
  },
  {
    id: "inventory_low",
    emoji: "📦",
    title: "Ojo al stock",
    desc: "Registraste inventario con alertas activas",
  },
];

/**
 * @param {string} userId
 */
export function getUnlockedMedals(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(medalsUnlockedKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} userId
 * @param {string} medalId
 */
export function unlockMedal(userId, medalId) {
  if (!userId) return false;
  const current = getUnlockedMedals(userId);
  if (current.includes(medalId)) return false;
  const next = [...current, medalId];
  try {
    localStorage.setItem(medalsUnlockedKey(userId), JSON.stringify(next));
  } catch {
    return false;
  }
  return true;
}

/**
 * @param {string} userId
 */
export function getSupermarketCheckCount(userId) {
  if (!userId) return 0;
  try {
    return Number(localStorage.getItem(supermarketCheckCountKey(userId))) || 0;
  } catch {
    return 0;
  }
}

/**
 * @param {string} userId
 */
export function incrementSupermarketCheckCount(userId) {
  if (!userId) return 0;
  const n = getSupermarketCheckCount(userId) + 1;
  try {
    localStorage.setItem(supermarketCheckCountKey(userId), String(n));
  } catch {
    /* ignore */
  }
  return n;
}

/**
 * Evalúa medallas nuevas según estado actual.
 * @param {string} userId
 * @param {{
 *   eventCount?: number;
 *   nextEventDays?: number | null;
 *   doneTaskCount?: number;
 *   lowStockCount?: number;
 *   supermarketChecks?: number;
 * }} stats
 * @returns {MedalDef[]} newly unlocked
 */
export function evaluateMedals(userId, stats) {
  if (!userId) return [];
  /** @type {string[]} */
  const toUnlock = [];

  if ((stats.eventCount ?? 0) >= 1) toUnlock.push("first_event");
  if (
    stats.nextEventDays != null &&
    stats.nextEventDays >= 0 &&
    stats.nextEventDays <= 7
  ) {
    toUnlock.push("event_soon");
  }
  if ((stats.doneTaskCount ?? 0) >= 5) toUnlock.push("home_tasks_5");
  if ((stats.supermarketChecks ?? 0) >= 10) toUnlock.push("super_10");
  if ((stats.lowStockCount ?? 0) > 0) toUnlock.push("inventory_low");

  const already = getUnlockedMedals(userId);
  /** @type {MedalDef[]} */
  const fresh = [];
  for (const id of toUnlock) {
    if (already.includes(id)) continue;
    if (unlockMedal(userId, id)) {
      const def = MEDAL_DEFINITIONS.find((m) => m.id === id);
      if (def) fresh.push(def);
    }
  }
  return fresh;
}

/**
 * @param {string} userId
 */
export function unlockListClearMedal(userId) {
  const def = MEDAL_DEFINITIONS.find((m) => m.id === "list_clear");
  if (!def) return null;
  return unlockMedal(userId, "list_clear") ? def : null;
}

/**
 * @param {string} userId
 */
export function unlockBackupMedal(userId) {
  const def = MEDAL_DEFINITIONS.find((m) => m.id === "backup_once");
  if (!def) return null;
  return unlockMedal(userId, "backup_once") ? def : null;
}
