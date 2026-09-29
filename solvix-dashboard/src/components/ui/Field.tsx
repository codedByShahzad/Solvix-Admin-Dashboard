import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const controlClasses = (invalid?: boolean, className?: string) =>
  cn(
    "w-full rounded-lg border bg-surface px-3 text-sm text-fg shadow-xs transition-colors",
    "placeholder:text-subtle focus:outline-none focus:border-brand focus:shadow-focus",
    "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted",
    invalid ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgb(var(--danger)/0.18)]" : "border-border hover:border-border-strong",
    className,
  );

interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  /** Right-aligned text in the label row, e.g. a character counter. */
  aside?: ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, className, children, aside }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
              {label}
              {required && <span className="ml-0.5 text-danger">*</span>}
            </label>
          )}
          {aside && <span className="text-xs tabular-nums text-subtle">{aside}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  prefixText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leftIcon, rightSlot, prefixText, className, ...props },
  ref,
) {
  if (!leftIcon && !rightSlot && !prefixText) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={controlClasses(invalid, cn("h-9", className))} {...props} />;
  }
  return (
    <div className="relative flex items-center">
      {leftIcon && <span className="pointer-events-none absolute left-3 text-subtle [&_svg]:size-4">{leftIcon}</span>}
      {prefixText && (
        <span className="pointer-events-none absolute left-3 select-none text-sm text-subtle">{prefixText}</span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={controlClasses(invalid, cn("h-9", leftIcon && "pl-9", rightSlot && "pr-10", className))}
        style={prefixText ? { paddingLeft: `${prefixText.length * 0.5 + 1}rem` } : undefined}
        {...props}
      />
      {rightSlot && <span className="absolute right-1.5 flex items-center">{rightSlot}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ invalid, className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={controlClasses(invalid, cn("min-h-[80px] resize-y py-2 leading-relaxed", className))}
        {...props}
      />
    );
  },
);

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, options, placeholder, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={controlClasses(invalid, cn("h-9 cursor-pointer appearance-none pr-9", className))}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );
});

export function Checkbox({ label, description, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 cursor-pointer rounded border-border-strong accent-[rgb(var(--brand))]"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="block text-sm font-medium text-fg">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-brand" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
