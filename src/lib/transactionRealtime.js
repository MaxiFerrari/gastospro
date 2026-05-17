function isOptimisticId(id) {
  return String(id).startsWith("optimistic");
}

function inFetchRange(createdAt, range) {
  if (!range?.from || !range?.to) return true;
  return createdAt >= range.from && createdAt <= range.to;
}

/**
 * Apply a Supabase realtime payload to the transactions list.
 */
export function applyTransactionRealtimeEvent(prev, payload, fetchRange) {
  const eventType = payload.eventType;
  const row = payload.new;
  const old = payload.old;

  if (eventType === "INSERT" && row) {
    if (isOptimisticId(row.id)) return prev;
    if (prev.some((t) => t.id === row.id)) return prev;
    if (!inFetchRange(row.created_at, fetchRange)) return prev;
    return [row, ...prev];
  }

  if (eventType === "UPDATE" && row) {
    const exists = prev.some((t) => t.id === row.id);
    if (!exists) {
      if (!inFetchRange(row.created_at, fetchRange)) return prev;
      return [row, ...prev];
    }
    return prev.map((t) => (t.id === row.id ? { ...t, ...row } : t));
  }

  if (eventType === "DELETE" && old) {
    return prev.filter((t) => t.id !== old.id);
  }

  return prev;
}
