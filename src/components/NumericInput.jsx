import { NumericFormat } from "react-number-format";

/**
 * Shared numeric input with es-AR formatting pre-configured.
 * All NumericFormat props are forwarded. Pass `className` to append extra
 * sizing / spacing classes on top of the base border/bg/focus styles.
 */
export default function NumericInput({
  className = "",
  decimalScale = 2,
  inputMode = "decimal",
  ...props
}) {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimalScale}
      allowNegative={false}
      inputMode={inputMode}
      className={`border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 ${className}`}
      {...props}
    />
  );
}
