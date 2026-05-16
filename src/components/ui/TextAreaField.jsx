import { forwardRef, useId } from "react";
import FieldShell from "./FieldShell";
import { inputControlClass } from "../../lib/formFieldStyles";

const TextAreaField = forwardRef(function TextAreaField(
  { label, id: idProp, error, hint, className = "", rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `fld-${autoId}`;

  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`${inputControlClass} resize-none ${className}`.trim()}
        {...rest}
      />
    </FieldShell>
  );
});

export default TextAreaField;
