"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation } from "@/store/api/authApi";
import { useAuth } from "@/features/auth/useAuth";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/lib/api/errors";
import { Button, Field, Input } from "@/components/ui";
import { useSubmitLock } from "@/hooks/useSubmitLock";

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
  const [login, { isLoading: loggingIn, isSuccess }] = useLoginMutation();
  const isLoading = loggingIn || isSuccess;
  const [showPassword, setShowPassword] = useState(false);
  const { locked, lock } = useSubmitLock();
  const [formError, setFormError] = useState<string | null>(null);
  // The session cookie expires together with the JWT, so on a fresh visit the
  // middleware may not know why — AuthBootstrap records it in the auth state.
  const signOutReason = useAppSelector((s) => s.auth.signOutReason);
  const expired = params.get("reason") === "expired" || signOutReason === "expired";
  const registered = params.get("registered") === "1";
  const next = safeNext(params.get("next"));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") ?? "", password: "" },
  });

  const onSubmit = async (values: Values) => {
    setFormError(null);
    try {
      // POST /auth/login → { token, user }. 401 = bad credentials, 403 = inactive account.
      const { token, user } = await login({ email: values.email.trim().toLowerCase(), password: values.password }).unwrap();
      signIn(token, user);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      router.replace(next);
    } catch (e) {
      setFormError(getErrorMessage(e));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in to Solvix</h1>
        <p className="mt-1.5 text-sm text-muted">Manage content across all Soldevix websites.</p>
      </div>

      {registered && !formError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft px-3.5 py-3 text-sm text-fg">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          <span>Account created. Sign in to continue.</span>
        </div>
      )}

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

      <form onSubmit={lock(handleSubmit(onSubmit))} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@soldevix.com" leftIcon={<Mail />} invalid={!!errors.email} className="h-10" {...register("email")} />
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
        <Button type="submit" size="lg" className="w-full" loading={isLoading || locked} rightIcon={<ArrowRight />}>
          {isLoading || locked ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
