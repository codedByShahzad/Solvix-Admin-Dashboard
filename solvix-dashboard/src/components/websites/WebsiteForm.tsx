"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Field, FormActions, FormSection, Input, Switch, Textarea } from "@/components/ui";
import { websiteSchema, websiteToForm, type WebsiteFormInput, type WebsiteFormValues } from "@/features/websites/schema";
import { slugify } from "@/utils/slug";
import type { Website } from "@/types";
import { useSubmitLock } from "@/hooks/useSubmitLock";

export function WebsiteForm({
  website,
  onSubmit,
  submitting,
  cancelHref,
}: {
  website?: Website;
  onSubmit: (values: WebsiteFormValues) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
}) {
  const router = useRouter();
  const isEdit = !!website;
  const { locked, lock } = useSubmitLock();
  const busy = submitting || locked;
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors, isDirty },
  } = useForm<WebsiteFormInput, unknown, WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: websiteToForm(website),
  });
  const name = watch("name");
  const description = watch("description");

  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(name ?? ""), { shouldDirty: true });
  }, [name, slugTouched, setValue]);

  return (
    <form onSubmit={lock(handleSubmit(onSubmit))} noValidate className="mx-auto max-w-3xl space-y-6">
      <FormSection title="Website details" description="How this website is identified in Solvix." icon={<Globe />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Topicler" invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Domain" htmlFor="domain" required error={errors.domain?.message} hint="Without https:// — e.g. topicler.com">
            <Input id="domain" placeholder="topicler.com" prefixText="https://" invalid={!!errors.domain} {...register("domain")} />
          </Field>
        </div>
        <Field
          label="Slug"
          htmlFor="slug"
          required
          error={errors.slug?.message}
          hint={slugTouched ? "Must be unique across websites." : "Generated from the name. Must be unique."}
        >
          <Input
            id="slug"
            placeholder="topicler"
            className="font-mono text-[13px]"
            invalid={!!errors.slug}
            {...register("slug", { onChange: () => setSlugTouched(true) })}
            rightSlot={
              slugTouched ? (
                <Button
                  variant="ghost"
                  size="xs"
                  title="Regenerate from name"
                  onClick={() => {
                    setSlugTouched(false);
                    setValue("slug", slugify(getValues("name")), { shouldDirty: true, shouldValidate: true });
                  }}
                >
                  <Sparkles className="size-3.5" />
                </Button>
              ) : undefined
            }
          />
        </Field>
        <Field label="Description" htmlFor="description" error={errors.description?.message} aside={`${description?.length ?? 0}/500`}>
          <Textarea id="description" rows={3} placeholder="AI tools for writers, students and creators…" invalid={!!errors.description} {...register("description")} />
        </Field>
      </FormSection>

      {isEdit && (
        <FormSection title="Status" icon={<Settings2 />}>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="rounded-xl border border-border p-4">
                <Switch
                  id="isActive"
                  checked={field.value}
                  onChange={field.onChange}
                  label="Active"
                  description="Turn off to mark this website as inactive in Solvix."
                />
              </div>
            )}
          />
        </FormSection>
      )}

      <FormActions note={isDirty ? "You have unsaved changes." : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {isEdit ? "Save changes" : "Create website"}
        </Button>
      </FormActions>
    </form>
  );
}
