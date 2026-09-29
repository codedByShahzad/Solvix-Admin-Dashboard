"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Globe, KeyRound, UserRound } from "lucide-react";
import { Button, EndpointNotice, Field, FormActions, FormSection, Input, Skeleton, Switch, TagInput } from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { useWebsiteOptions } from "@/features/websites/useWebsiteOptions";
import { createEditorSchema, editorToForm, updateEditorSchema, type EditorFormValues } from "@/features/editors/schema";
import { cn } from "@/lib/cn";
import type { EndpointKey } from "@/lib/api/endpoints";
import type { Editor } from "@/types";

export function EditorForm({
  editor,
  onSubmit,
  submitting,
  cancelHref,
  endpoint,
}: {
  editor?: Editor;
  onSubmit: (v: EditorFormValues) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
  endpoint: EndpointKey;
}) {
  const router = useRouter();
  const isEdit = !!editor;
  const [showPw, setShowPw] = useState(false);
  const { websites, isLoading: websitesLoading, unavailable } = useWebsiteOptions();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<EditorFormValues>({
    resolver: zodResolver(isEdit ? updateEditorSchema : createEditorSchema),
    defaultValues: editorToForm(editor),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl space-y-6">
      <EndpointNotice endpoints={[endpoint]} />

      <FormSection title="Profile" description="The editor signs in with this email." icon={<UserRound />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="Ayesha Khan" autoComplete="off" invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" placeholder="ayesha@soldevix.com" autoComplete="off" invalid={!!errors.email} {...register("email")} />
          </Field>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="rounded-xl border border-border p-4">
              <Switch
                id="isActive"
                checked={field.value}
                onChange={field.onChange}
                label="Active account"
                description="Inactive editors can't sign in, but their content is kept."
              />
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title={isEdit ? "Reset password" : "Password"}
        description={isEdit ? "Leave blank to keep the current password." : "Share it securely — the editor can change it later."}
        icon={<KeyRound />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={isEdit ? "New password" : "Password"} htmlFor="password" required={!isEdit} error={errors.password?.message} hint="At least 8 characters.">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={!!errors.password}
              {...register("password")}
              rightSlot={
                <button type="button" onClick={() => setShowPw((v) => !v)} className="rounded-md p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" required={!isEdit} error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Website access" description="The editor can only manage blogs and media for these websites." icon={<Globe />}>
        <Controller
          control={control}
          name="websites"
          render={({ field }) =>
            websitesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : unavailable ? (
              <Field label="Website IDs" hint="The website list isn't available yet — enter website IDs.">
                <TagInput value={field.value} onChange={field.onChange} placeholder="Paste a website ID and press Enter" />
              </Field>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {websites.map((w) => {
                  const checked = field.value.includes(w.id);
                  return (
                    <label
                      key={w.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors",
                        checked ? "border-brand bg-brand-soft/50" : "border-border hover:border-border-strong",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => field.onChange(checked ? field.value.filter((x) => x !== w.id) : [...field.value, w.id])}
                        className="size-4 accent-[rgb(var(--brand))]"
                      />
                      <WebsiteAvatar website={{ id: w.id, name: w.name ?? w.id }} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">{w.name ?? w.id}</span>
                        {w.domain && <span className="block truncate text-xs text-muted">{w.domain}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )
          }
        />
      </FormSection>

      <FormActions note={isDirty ? "Unsaved changes" : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? "Save changes" : "Create editor"}
        </Button>
      </FormActions>
    </form>
  );
}
