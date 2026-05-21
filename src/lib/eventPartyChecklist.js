/**
 * Pure helpers for party checklist UI (testable without React).
 */

/** @param {Array<{ rsvp?: string }>} guests */
export function summarizeGuests(guests) {
  const list = guests ?? [];
  const total = list.length;
  const confirmed = list.filter((g) => g.rsvp === "yes").length;
  const pendingRsvp = list.filter(
    (g) => g.rsvp === "pending" || g.rsvp === "maybe",
  ).length;
  const declined = list.filter((g) => g.rsvp === "no").length;
  return { confirmed, total, pendingRsvp, declined };
}

/**
 * @param {number | null | undefined} budgetAmount
 * @param {Array<{ amount?: number }>} expenses
 */
export function summarizeBudget(budgetAmount, expenses) {
  const spent = (expenses ?? []).reduce(
    (sum, ex) => sum + (Number(ex.amount) || 0),
    0,
  );
  const budget =
    budgetAmount != null && !Number.isNaN(Number(budgetAmount))
      ? Number(budgetAmount)
      : null;
  if (budget == null || budget <= 0) {
    return { spent, budget: null, pct: null, over: false };
  }
  const pct = Math.round((spent / budget) * 100);
  return { spent, budget, pct, over: spent > budget };
}

/** @param {Array<{ done?: boolean }>} items */
export function checklistProgress(items) {
  const list = items ?? [];
  const total = list.length;
  const done = list.filter((i) => i.done).length;
  return { done, total, pending: total - done };
}

/** Default checklist rows when creating an event. */
export const EVENT_CHECKLIST_TEMPLATES = {
  birthday: [
    { title: "Confirmar lista de invitados", category: "prep", sort_order: 0 },
    { title: "Armar lista de compras", category: "shopping", sort_order: 1 },
    { title: "Comprar torta / snacks", category: "shopping", sort_order: 2 },
    { title: "Decoración y mesa", category: "prep", sort_order: 3 },
  ],
  other: [
    { title: "Confirmar invitados", category: "prep", sort_order: 0 },
    { title: "Lista de compras", category: "shopping", sort_order: 1 },
    { title: "Preparar lugar", category: "prep", sort_order: 2 },
  ],
};

/**
 * @param {string} kind
 * @returns {typeof EVENT_CHECKLIST_TEMPLATES.birthday}
 */
export function getChecklistTemplate(kind) {
  return kind === "birthday"
    ? EVENT_CHECKLIST_TEMPLATES.birthday
    : EVENT_CHECKLIST_TEMPLATES.other;
}
