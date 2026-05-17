import { DEFAULT_SHOPPING_CONTEXT } from "./shoppingContexts";

/**
 * @typedef {'events'|'home'|'shopping'|'finance'} ActionMode
 * @typedef {{ title: string; subtitle: string; mode: ActionMode; shoppingContext?: string; openSupermarket?: boolean }} WhatToDoResult
 */

/**
 * @param {{
 *   nextEvent?: { event: { title: string }; days: number } | null;
 *   pendingTasks?: Array<{ title: string; assignee?: string }>;
 *   lowStock?: Array<{ name: string }>;
 *   pendingShoppingCount?: number;
 * }} input
 * @returns {WhatToDoResult}
 */
export function pickWhatToDoNow(input) {
  const {
    nextEvent = null,
    pendingTasks = [],
    lowStock = [],
    pendingShoppingCount = 0,
  } = input;

  if (nextEvent?.days === 0) {
    return {
      title: `Hoy: ${nextEvent.event.title}`,
      subtitle: "Revisá invitados y gastos del evento",
      mode: "events",
    };
  }

  if (nextEvent?.days === 1) {
    return {
      title: `Mañana: ${nextEvent.event.title}`,
      subtitle: "Último día para compras o preparar la casa",
      mode: "events",
    };
  }

  if (nextEvent && nextEvent.days <= 7) {
    return {
      title: `En ${nextEvent.days} días: ${nextEvent.event.title}`,
      subtitle: "Planificá compras o invitados con tiempo",
      mode: "events",
    };
  }

  if (lowStock.length > 0) {
    return {
      title: `Reponer: ${lowStock[0].name}`,
      subtitle:
        lowStock.length > 1
          ? `Y ${lowStock.length - 1} más con stock bajo`
          : "Inventario por debajo del mínimo",
      mode: "shopping",
      shoppingContext: DEFAULT_SHOPPING_CONTEXT,
    };
  }

  if (pendingTasks.length > 0) {
    const t = pendingTasks[0];
    return {
      title: t.title,
      subtitle: t.assignee ? `Tarea de ${t.assignee}` : "Tarea del hogar",
      mode: "home",
    };
  }

  if (pendingShoppingCount > 0) {
    return {
      title: `${pendingShoppingCount} ítem${pendingShoppingCount > 1 ? "s" : ""} en la lista`,
      subtitle: "Modo supermercado para tachar en el pasillo",
      mode: "shopping",
      shoppingContext: DEFAULT_SHOPPING_CONTEXT,
      openSupermarket: true,
    };
  }

  if (nextEvent) {
    return {
      title: nextEvent.event.title,
      subtitle: "Seguí planificando la celebración",
      mode: "events",
    };
  }

  return {
    title: "Anotá un gasto del día",
    subtitle: "Todo al día — mantené las finanzas al día",
    mode: "finance",
  };
}
