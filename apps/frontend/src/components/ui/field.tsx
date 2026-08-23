"use client";
// PHASE 5 §6 — form controls: Input, PasswordInput, Select, NumberInput.
import { forwardRef, useId, useState } from "react";

export interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  children,
}: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger"> *</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "touch-target w-full rounded-sm2 border bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-muted/70 focus:border-primary disabled:opacity-60";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, mono, className = "", ...rest },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${inputBase} ${mono ? "font-mono" : ""} ${error ? "border-danger" : "border-line"} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  function Select({ label, error, hint, required, className = "", children, ...rest }, ref) {
    const id = useId();
    return (
      <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputBase} ${error ? "border-danger" : "border-line"} ${className}`}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);

export function PasswordInput(props: InputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-[30px] rounded p-1.5 text-muted hover:text-ink"
      >
        {visible ? "🙈" : "👁"}
      </button>
    </div>
  );
}

export function NumberInput(props: InputProps) {
  return <Input {...props} inputMode="decimal" autoComplete="off" />;
}
