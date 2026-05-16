import { forwardRef, useId } from "react";
import FieldShell from "./FieldShell";
import { inputControlClass } from "../../lib/formFieldStyles";

const TextField = forwardRef(function TextField(
  {
    label,
    id: idProp,
    error,
    hint,
    className = "",
    type = "text",
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `fld-${autoId}`;

  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <input
        ref={ref}
        id={id}
        type={type}
        className={`${inputControlClass} ${className}`.trim()}
        {...rest}
      />
    </FieldShell>
  );
});

export default TextField;
