import { useState, useCallback } from "react";

export function useMonthFilter() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const goToPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, [year, month, now]);

  const goToMonth = useCallback(
    (m, y) => {
      // Don't allow future months
      if (
        y > now.getFullYear() ||
        (y === now.getFullYear() && m > now.getMonth())
      )
        return;
      setMonth(m);
      setYear(y);
    },
    [now],
  );

  const pickerPrevYear = useCallback(() => setYear((y) => y - 1), []);
  const pickerNextYear = useCallback(() => {
    setYear((y) => {
      if (y >= now.getFullYear()) return y;
      return y + 1;
    });
  }, [now]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const label = new Date(year, month, 1).toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const filterTransactions = useCallback(
    (transactions) =>
      transactions.filter((t) => {
        const d = new Date(t.created_at);
        return d.getUTCMonth() === month && d.getUTCFullYear() === year;
      }),
    [month, year],
  );

  return {
    year,
    month,
    label,
    isCurrentMonth,
    goToPrev,
    goToNext,
    goToMonth,
    pickerPrevYear,
    pickerNextYear,
    filterTransactions,
  };
}
