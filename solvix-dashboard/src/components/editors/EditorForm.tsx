"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Globe, KeyRound, UserRound } from "lucide-react";
import { Button, Field, FormActions, FormSection, Input } from "@/components/ui";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import { createEditorSchema, emptyEditorForm, type EditorFormValues } from "@/features/editors/schema";
import { WebsiteCheckboxList } from "./WebsiteCheckboxList";
import { useSubmitLock } from "@/hooks/useSubmitLock";

/** Create-editor form. (The backend has no route to edit or delete users.) */
export function EditorForm({
  onSubmit,
  submitting,
  cancelHref,
}: {
  onSubmit: (v: EditorFormValues) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
}) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const { locked, lock } = useSubmitLock();
  const busy = submitting || locked;
  const websitesQ = useGetWebsitesQuery();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<EditorFormValues>({ resolver: zodResolver(createEditorSchema), defaultValues: emptyEditorForm });

  return (
    <form onSubmit={lock(handleSubmit(onSubmit))} noValidate className="mx-auto max-w-3xl space-y-6">
      <FormSection title="Profile" description="The editor signs in with this email." icon={<UserRound />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="Ayesha Khan" autoComplete="off" invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" placeholder="ayesha@soldevix.com" autoComplete="off" invalid={!!errors.email} {...register("email")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Password" description="Share it with the editor securely." icon={<KeyRound />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" required error={errors.password?.message} hint="At least 8 characters.">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register("password")}
              rightSlot={
                <button type="button" onClick={() => setShowPw((v) => !v)} className="rounded-md p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type={showPw ? "text" : "password"} autoComplete="new-password" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Website access" description="The editor can manage blogs and media only for these websites." icon={<Globe />}>
        <Controller
          control={control}
          name="websites"
          render={({ field }) => <WebsiteCheckboxList websites={websitesQ.data ?? []} value={field.value} onChange={field.onChange} loading={websitesQ.isLoading} />}
        />
      </FormSection>

      <FormActions note={isDirty ? "Unsaved changes" : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Create editor
        </Button>
      </FormActions>
    </form>
  );
}
