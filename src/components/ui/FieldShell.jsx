import { labelClass, hintClass, fieldErrorClass } from "@lib/formFieldStyles";

/**
 * Label + control slot + hint or error (one line under the control).
 */
export default function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {label != null && label !== "" && (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className={fieldErrorClass}>{error}</p>
      ) : hint ? (
        <p className={hintClass}>{hint}</p>
      ) : null}
    </div>
  );
}
