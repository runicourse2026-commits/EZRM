import { useId } from 'react';

export function Field({ label, hint, error, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function TextInput({ label, hint, error, ...props }) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} className="input" aria-invalid={error ? 'true' : undefined} {...props} />
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

/**
 * Numeric keypad on phones. `inputMode` matters more than `type=number` here —
 * it gives the big digit keypad without the fiddly spinner arrows.
 */
export function NumberInput({ label, hint, error, decimal = true, ...props }) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        className="input numeric"
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function Select({ label, hint, error, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} className="select" aria-invalid={error ? 'true' : undefined} {...props}>
        {children}
      </select>
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function TextArea({ label, hint, error, ...props }) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <textarea id={id} className="textarea" aria-invalid={error ? 'true' : undefined} {...props} />
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
