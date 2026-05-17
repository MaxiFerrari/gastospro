import { useState, useCallback, useMemo } from "react";

const now = () => new Date();

/**
 * @param {{ year?: number, month?: number, setYearMonth?: (year: number, month: number) => void } | undefined} controlled
 * When year/month/setYearMonth are provided (from the URL), navigation updates the route.
 */
export function useMonthFilter(controlled) {
  const n = now();
  const [internalYear, setInternalYear] = useState(n.getFullYear());
  const [internalMonth, setInternalMonth] = useState(n.getMonth());

  const year = controlled?.year ?? internalYear;
  const month = controlled?.month ?? internalMonth;
  const setYearMonth = controlled?.setYearMonth;

  const applyMonth = useCallback(
    (ny, nm) => {
      if (setYearMonth) setYearMonth(ny, nm);
      else {
        setInternalYear(ny);
        setInternalMonth(nm);
      }
    },
    [setYearMonth],
  );

  const goToPrev = useCallback(() => {
    if (month === 0) applyMonth(year - 1, 11);
    else applyMonth(year, month - 1);
  }, [month, year, applyMonth]);

  const goToNext = useCallback(() => {
    if (month === 11) applyMonth(year + 1, 0);
    else applyMonth(year, month + 1);
  }, [month, year, applyMonth]);

  const goToMonth = useCallback(
    (m, y) => applyMonth(y, m),
    [applyMonth],
  );

  const pickerPrevYear = useCallback(
    () => applyMonth(year - 1, month),
    [year, month, applyMonth],
  );

  const pickerNextYear = useCallback(
    () => applyMonth(year + 1, month),
    [year, month, applyMonth],
  );

  const isCurrentMonth =
    year === n.getFullYear() && month === n.getMonth();

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

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
