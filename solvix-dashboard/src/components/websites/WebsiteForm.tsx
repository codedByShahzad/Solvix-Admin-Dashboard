"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, EndpointNotice, Field, FormActions, FormSection, Input, Select, Textarea } from "@/components/ui";
import {
  WEBSITE_STATUSES,
  websiteSchema,
  websiteToForm,
  type WebsiteFormInput,
  type WebsiteFormValues,
} from "@/features/websites/schema";
import type { EndpointKey } from "@/lib/api/endpoints";
import type { Website } from "@/types";

export function WebsiteForm({
  website,
  onSubmit,
  submitting,
  cancelHref,
  endpoint,
}: {
  website?: Website;
  onSubmit: (values: WebsiteFormValues) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
  endpoint: EndpointKey;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<WebsiteFormInput, unknown, WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: websiteToForm(website),
  });
  const description = watch("description");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl space-y-6">
      <EndpointNotice endpoints={[endpoint]} />

      <FormSection title="Website details" description="How this website appears across Solvix." icon={<Globe />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Topicler" invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Domain" htmlFor="domain" required error={errors.domain?.message} hint="Without https:// — e.g. topicler.com">
            <Input id="domain" placeholder="topicler.com" prefixText="https://" invalid={!!errors.domain} {...register("domain")} />
          </Field>
        </div>
        <Field
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          aside={`${description?.length ?? 0}/500`}
          hint="A short internal note about what this website is for."
        >
          <Textarea id="description" rows={3} placeholder="AI tools for writers, students and creators…" invalid={!!errors.description} {...register("description")} />
        </Field>
      </FormSection>

      <FormSection title="Status" description="Inactive websites stay in Solvix but are hidden from integrations." icon={<Settings2 />}>
        <Field label="Status" htmlFor="status" className="sm:max-w-xs">
          <Select id="status" options={WEBSITE_STATUSES} {...register("status")} />
        </Field>
      </FormSection>

      <FormActions note={isDirty ? "You have unsaved changes." : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {website ? "Save changes" : "Create website"}
        </Button>
      </FormActions>
    </form>
  );
}
