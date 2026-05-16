import AmountField from "./ui/AmountField";

/**
 * @deprecated Use AmountField from ./ui/AmountField for new code.
 * Thin wrapper for existing imports (BudgetPanel, FixedItemsPanel, TransactionList).
 */
export default function NumericInput({
  className = "",
  compact = false,
  decimalScale = 2,
  inputMode = "decimal",
  ...props
}) {
  return (
    <AmountField
      compact={compact}
      decimalScale={decimalScale}
      inputMode={inputMode}
      className={className}
      {...props}
    />
  );
}
