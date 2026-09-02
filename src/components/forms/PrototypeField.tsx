interface PrototypeFieldProps {
  id: string;
  label: string;
  hint: string;
  type?: "email" | "password" | "text";
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function PrototypeField({
  id,
  label,
  hint,
  type = "text",
  placeholder,
  required = false,
  error,
}: PrototypeFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={error ? "true" : undefined}
        id={id}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      <span className="field-hint" id={hintId}>{hint}</span>
      {error ? <span className="field-error" id={errorId}>{error}</span> : null}
    </div>
  );
}
