import { useState, useCallback } from "react";

export function useMonthFilter() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const goToPrev = useCallback(() => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }, [month, year]);

  const goToNext = useCallback(() => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }, [month, year]);

  const goToMonth = useCallback((m, y) => {
    setMonth(m);
    setYear(y);
  }, []);

  const pickerPrevYear = useCallback(() => setYear((y) => y - 1), []);
  const pickerNextYear = useCallback(() => setYear((y) => y + 1), []);

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
