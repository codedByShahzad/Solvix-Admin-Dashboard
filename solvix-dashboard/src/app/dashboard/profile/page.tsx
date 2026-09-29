"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Globe, KeyRound, LogOut, Palette, UserRound } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  DetailList,
  EndpointNotice,
  Field,
  Input,
  PageHeader,
  RoleBadge,
} from "@/components/ui";
import { ThemeSelector } from "@/components/dashboard/ThemeToggle";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { useChangePasswordMutation } from "@/store/api/authApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import { getJwtExpiry } from "@/utils/jwt";
import { formatDateTime, formatRelative } from "@/utils/format";

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Passwords don't match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a different password" });
type PwValues = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const { user, token, isDemo, signOut } = useAuth();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const run = useMutationToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PwValues>({ resolver: zodResolver(pwSchema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });

  if (!user) return null;
  const expiry = token && !isDemo ? getJwtExpiry(token) : null;

  return (
    <>
      <PageHeader title="Profile" description="Your account and preferences." />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-brand to-[#8B7CF6]" />
            <div className="-mt-9 px-5 pb-5">
              <Avatar name={user.name} src={user.avatar} size="xl" className="ring-4 ring-surface" />
              <h2 className="mt-3 text-lg font-semibold text-fg">{user.name}</h2>
              <p className="text-sm text-muted">{user.email || "—"}</p>
              <div className="mt-3">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader icon={<Clock />} title="Session" />
            <div className="p-5">
              <DetailList
                items={[
                  { label: "Mode", value: isDemo ? "Demo preview" : "Signed in" },
                  { label: "Expires", value: expiry ? `${formatRelative(expiry)} (${formatDateTime(expiry)})` : "—" },
                ]}
              />
              <Button variant="danger-soft" className="mt-4 w-full" leftIcon={<LogOut />} onClick={() => signOut()}>
                Log out
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader icon={<UserRound />} title="Account details" description="Contact an admin to change your name, email or role." />
            <div className="p-5">
              <DetailList
                items={[
                  { label: "Name", value: user.name },
                  { label: "Email", value: user.email || "—" },
                  { label: "Role", value: <RoleBadge role={user.role} /> },
                  { label: "User ID", value: <code className="font-mono text-xs">{user.id || "—"}</code> },
                ]}
              />
            </div>
          </Card>

          {user.role === "editor" && (
            <Card>
              <CardHeader icon={<Globe />} title="Website access" />
              <div className="p-5">
                {user.websites?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {user.websites.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                        <WebsiteAvatar website={{ id: w.id, name: w.name ?? w.id }} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-fg">{w.name ?? w.id}</div>
                          {w.domain && <div className="truncate text-xs text-muted">{w.domain}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Your website access is managed by an admin.</p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader icon={<KeyRound />} title="Change password" />
            <form
              noValidate
              className="space-y-4 p-5"
              onSubmit={handleSubmit(async (v) => {
                const ok = await run(changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }).unwrap(), "Password updated successfully");
                if (ok !== undefined) reset();
              })}
            >
              <EndpointNotice endpoints={["auth.changePassword"]} />
              <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
                <Input id="currentPassword" type="password" autoComplete="current-password" invalid={!!errors.currentPassword} {...register("currentPassword")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
                  <Input id="newPassword" type="password" autoComplete="new-password" invalid={!!errors.newPassword} {...register("newPassword")} />
                </Field>
                <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
                  <Input id="confirm" type="password" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={isLoading}>
                  Update password
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader icon={<Palette />} title="Appearance" />
            <div className="p-5">
              <ThemeSelector />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
