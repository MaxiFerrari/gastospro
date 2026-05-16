import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";
import FieldShell from "./FieldShell";
import {
  inputControlClass,
  inputControlClassCompact,
} from "../../lib/formFieldStyles";

/**
 * Monto en formato es-AR (miles con punto, decimales con coma).
 * Reenvía el resto de props a NumericFormat.
 */
const AmountField = forwardRef(function AmountField(
  {
    label,
    id,
    error,
    hint,
    className = "",
    compact = false,
    decimalScale = 2,
    allowNegative = false,
    thousandSeparator = ".",
    decimalSeparator = ",",
    ...rest
  },
  ref,
) {
  const base = compact ? inputControlClassCompact : inputControlClass;
  const mergedClass = `${base} ${className}`.trim();

  const control = (
    <NumericFormat
      id={id}
      getInputRef={ref}
      thousandSeparator={thousandSeparator}
      decimalSeparator={decimalSeparator}
      decimalScale={decimalScale}
      allowNegative={allowNegative}
      className={mergedClass}
      {...rest}
    />
  );

  if (label != null && label !== "") {
    return (
      <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
        {control}
      </FieldShell>
    );
  }

  if (error || hint) {
    return (
      <FieldShell error={error} hint={hint}>
        {control}
      </FieldShell>
    );
  }

  return control;
});

export default AmountField;
