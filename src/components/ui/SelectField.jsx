import { useId } from "react";
import FieldShell from "./FieldShell";
import { selectControlClass } from "../../lib/formFieldStyles";

export default function SelectField({
  label,
  id: idProp,
  error,
  hint,
  className = "",
  children,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `sel-${autoId}`;

  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <select
        id={id}
        className={`${selectControlClass} ${className}`.trim()}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
