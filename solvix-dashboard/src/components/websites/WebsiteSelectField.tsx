"use client";

import { Field, Input, Select, Skeleton } from "@/components/ui";
import { useWebsiteOptions } from "@/features/websites/useWebsiteOptions";

/**
 * Website picker used by blog / media / editor forms. Falls back to a raw
 * Website ID input when no website list is available (route pending or editor
 * without assigned websites in their session).
 */
export function WebsiteSelectField({
  value,
  onChange,
  error,
  required,
  label = "Website",
  allowEmpty,
  emptyLabel = "No website",
  id = "website",
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  id?: string;
}) {
  const { options, isLoading, unavailable } = useWebsiteOptions();

  if (isLoading) {
    return (
      <Field label={label} required={required}>
        <Skeleton className="h-9 w-full rounded-lg" />
      </Field>
    );
  }

  if (unavailable) {
    return (
      <Field
        label={`${label} ID`}
        htmlFor={id}
        required={required}
        error={error}
        hint="The website list isn't available yet, so enter the website's ID."
      >
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. 665f1c2e9b1e8a0012ab34cd" invalid={!!error} className="font-mono text-[13px]" />
      </Field>
    );
  }

  return (
    <Field label={label} htmlFor={id} required={required} error={error}>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={allowEmpty ? emptyLabel : "Select a website"}
        invalid={!!error}
      />
    </Field>
  );
}
