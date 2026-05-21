/**
 * Recurring home task dates and due status (testable without React).
 */

const MS_DAY = 24 * 60 * 60 * 1000;

/** @param {Date} d */
function toDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** @param {string} iso YYYY-MM-DD */
function parseLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * @param {'weekly'|'monthly'} recurrence
 * @param {number} recurrenceDay 0-6 weekly, 1-31 monthly
 * @param {Date} [fromDate]
 */
export function computeInitialDueDate(recurrence, recurrenceDay, fromDate = new Date()) {
  const base = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );

  if (recurrence === "weekly") {
    const target = recurrenceDay % 7;
    const current = base.getDay();
    let diff = target - current;
    if (diff < 0) diff += 7;
    if (diff === 0) return toDateString(base);
    base.setDate(base.getDate() + diff);
    return toDateString(base);
  }

  if (recurrence === "monthly") {
    const day = Math.min(Math.max(recurrenceDay, 1), 31);
    let candidate = new Date(base.getFullYear(), base.getMonth(), day);
    if (candidate < base) {
      candidate = new Date(base.getFullYear(), base.getMonth() + 1, day);
    }
    const lastDay = new Date(
      candidate.getFullYear(),
      candidate.getMonth() + 1,
      0,
    ).getDate();
    if (day > lastDay) {
      candidate = new Date(
        candidate.getFullYear(),
        candidate.getMonth(),
        lastDay,
      );
    }
    return toDateString(candidate);
  }

  return toDateString(base);
}

/**
 * @param {'weekly'|'monthly'} recurrence
 * @param {number} recurrenceDay
 * @param {string} currentDue YYYY-MM-DD
 */
export function advanceDueDate(recurrence, recurrenceDay, currentDue) {
  const d = parseLocalDate(currentDue);

  if (recurrence === "weekly") {
    d.setDate(d.getDate() + 7);
    return toDateString(d);
  }

  if (recurrence === "monthly") {
    const day = Math.min(Math.max(recurrenceDay, 1), 31);
    let next = new Date(d.getFullYear(), d.getMonth() + 1, day);
    const lastDay = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0,
    ).getDate();
    if (day > lastDay) {
      next = new Date(next.getFullYear(), next.getMonth(), lastDay);
    }
    return toDateString(next);
  }

  return currentDue;
}

/**
 * @param {{ recurrence?: string | null; next_due_date?: string | null; done?: boolean }} task
 * @param {Date} [today]
 * @returns {'none'|'overdue'|'due_today'|'upcoming'}
 */
export function getDueStatus(task, today = new Date()) {
  if (!task.recurrence || !task.next_due_date) return "none";
  if (task.done) return "none";

  const due = parseLocalDate(task.next_due_date);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((due.getTime() - now.getTime()) / MS_DAY);

  if (diff < 0) return "overdue";
  if (diff === 0) return "due_today";
  return "upcoming";
}

/** @param {'overdue'|'due_today'|'upcoming'|'none'} status */
export function dueStatusLabel(status) {
  switch (status) {
    case "overdue":
      return "Atrasada";
    case "due_today":
      return "Vence hoy";
    case "upcoming":
      return "Próxima";
    default:
      return null;
  }
}

/** @param {'weekly'|'monthly'} recurrence */
export function recurrenceLabel(recurrence) {
  return recurrence === "weekly" ? "Cada semana" : "Cada mes";
}

/**
 * Whether a pending task should appear in the main pending list.
 * @param {{ recurrence?: string | null; next_due_date?: string | null; done?: boolean }} task
 * @param {Date} [today]
 */
export function isActionablePending(task, today = new Date()) {
  if (task.done) return false;
  if (!task.recurrence) return true;
  const status = getDueStatus(task, today);
  return status === "overdue" || status === "due_today";
}

/**
 * Recurring tasks due in the future (not today/overdue).
 * @param {{ recurrence?: string | null; next_due_date?: string | null; done?: boolean }} task
 * @param {Date} [today]
 */
export function isUpcomingRecurring(task, today = new Date()) {
  if (task.done || !task.recurrence) return false;
  return getDueStatus(task, today) === "upcoming";
}
