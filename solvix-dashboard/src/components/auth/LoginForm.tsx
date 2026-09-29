"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, UserPen } from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation } from "@/store/api/authApi";
import { parseLoginResponse } from "@/features/auth/parseLoginResponse";
import { useAuth } from "@/features/auth/useAuth";
import { getErrorMessage } from "@/lib/api/errors";
import { config } from "@/lib/config";
import { DEMO_USERS } from "@/lib/demo/data";
import { Button, Field, Input } from "@/components/ui";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

function safeNext(next: string | null): string {
  return next && next.startsWith("/dashboard") ? next : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuth();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const expired = params.get("reason") === "expired";
  const next = safeNext(params.get("next"));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: Values) => {
    setFormError(null);
    try {
      const res = await login(values).unwrap();
      const parsed = parseLoginResponse(res);
      if (!parsed.ok) {
        setFormError(
          parsed.reason === "unsupported-role"
            ? "Your account doesn't have dashboard access."
            : "Signed in, but the server response had no token. Check parseLoginResponse.ts against the backend.",
        );
        return;
      }
      signIn(parsed.token, parsed.user, "live");
      toast.success(`Welcome back, ${parsed.user.name.split(" ")[0]}`);
      router.replace(next);
    } catch (e) {
      setFormError(getErrorMessage(e));
    }
  };

  const startDemo = (role: "admin" | "editor") => {
    signIn(`demo-${role}`, DEMO_USERS[role], "demo");
    toast.info(`Demo preview as ${role === "admin" ? "Admin" : "Editor"}`, { description: "Sample data only — nothing is saved." });
    router.replace("/dashboard");
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in to Solvix</h1>
        <p className="mt-1.5 text-sm text-muted">Manage content across all Soldevix websites.</p>
      </div>

      {(expired || formError) && (
        <div
          role="alert"
          className={
            formError
              ? "mb-5 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger"
              : "mb-5 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-3 text-sm text-fg"
          }
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError ?? "Your session has expired. Please sign in again."}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@soldevix.com"
            leftIcon={<Mail />}
            invalid={!!errors.email}
            className="h-10"
            {...register("email")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={<Lock />}
            invalid={!!errors.password}
            className="h-10"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-md p-1.5 text-subtle hover:bg-surface-2 hover:text-fg"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register("password")}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isLoading} rightIcon={<ArrowRight />}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {config.demoEnabled && (
        <div className="mt-8">
          <div className="relative flex items-center">
            <div className="h-px flex-1 bg-border" />
            <span className="px-3 text-xs font-medium text-subtle">or preview the UI with sample data</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => startDemo("admin")} leftIcon={<ShieldCheck />}>
              Preview as Admin
            </Button>
            <Button variant="secondary" onClick={() => startDemo("editor")} leftIcon={<UserPen />}>
              Preview as Editor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
