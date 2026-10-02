"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Field, Select, Skeleton } from "@/components/ui";
import { useWebsiteOptions } from "@/features/websites/useWebsiteOptions";
import { useIsAdmin } from "@/features/auth/useAuth";

/** Website picker for blog / media forms, fed by GET /websites. */
export function WebsiteSelectField({
  value,
  onChange,
  error,
  required,
  label = "Website",
  id = "website",
  disabled,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  id?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const { options, isLoading, isError } = useWebsiteOptions();
  const isAdmin = useIsAdmin();

  // Only one website available (typical for editors) → select it automatically.
  const only = options.length === 1 ? options[0].value : "";
  useEffect(() => {
    if (!value && only && !disabled) onChange(only);
  }, [value, only, disabled, onChange]);

  if (isLoading) {
    return (
      <Field label={label} required={required}>
        <Skeleton className="h-9 w-full rounded-lg" />
      </Field>
    );
  }

  const emptyHint = isError
    ? "Couldn't load websites."
    : options.length === 0
      ? isAdmin
        ? undefined
        : "You aren't assigned to any website yet — ask an admin."
      : hint;

  return (
    <Field label={label} htmlFor={id} required={required} error={error} hint={emptyHint}>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={options.length ? "Select a website" : "No websites available"}
        invalid={!!error}
        disabled={disabled || options.length === 0}
      />
      {isAdmin && options.length === 0 && !isError && (
        <p className="text-xs text-muted">
          No websites yet.{" "}
          <Link href="/dashboard/websites/create" className="font-medium text-brand hover:underline">
            Add a website
          </Link>{" "}
          first.
        </p>
      )}
    </Field>
  );
}
