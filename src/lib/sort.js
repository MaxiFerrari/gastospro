/**
 * Sort transactions for the monthly list: explicit sort_order, then fixed-item
 * order, then created_at descending.
 */
export function sortMonthlyTransactions(transactions, fixedItems) {
  const fixedMap = new Map(fixedItems.map((fi) => [fi.id, fi]));
  return [...transactions].sort((a, b) => {
    if (a.sort_order != null && b.sort_order != null)
      return a.sort_order - b.sort_order;
    if (a.sort_order != null) return -1;
    if (b.sort_order != null) return 1;

    const fiA = a.fixed_item_id ? fixedMap.get(a.fixed_item_id) : null;
    const fiB = b.fixed_item_id ? fixedMap.get(b.fixed_item_id) : null;
    const aFallback = fiA != null ? (fiA.sort_order ?? 0) : Infinity;
    const bFallback = fiB != null ? (fiB.sort_order ?? 0) : Infinity;
    if (aFallback !== bFallback) return aFallback - bFallback;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}
