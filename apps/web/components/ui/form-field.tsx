import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Inline validation / helper message. Errors are announced. */
export function ValidationMessage({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "hint";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "mt-1 text-xs",
        tone === "error" ? "text-negative" : "text-faint",
      )}
    >
      {children}
    </p>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Labelled form field: label + control + hint or error. Wires the label to the
 * control via `htmlFor`/`id`; renders `ValidationMessage` for errors.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 text-xs font-medium text-muted"
      >
        {label}
        {required ? <span className="ml-0.5 text-negative">*</span> : null}
      </label>
      {children}
      {error ? (
        <ValidationMessage>{error}</ValidationMessage>
      ) : hint ? (
        <ValidationMessage tone="hint">{hint}</ValidationMessage>
      ) : null}
    </div>
  );
}

const controlClass =
  "rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg placeholder:text-faint transition-colors focus:border-accent-dim focus:outline-none aria-[invalid=true]:border-negative";

/** Styled text input primitive. */
export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

/** Styled select primitive. */
export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, className)} {...props}>
      {children}
    </select>
  );
}
