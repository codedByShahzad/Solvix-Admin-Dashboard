"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation, useRegisterMutation } from "@/store/api/authApi";
import { useAuth } from "@/features/auth/useAuth";
import { getErrorMessage } from "@/lib/api/errors";
import { Button, Field, Input, Segmented } from "@/components/ui";
import type { Role } from "@/types";
import { useSubmitLock } from "@/hooks/useSubmitLock";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
    role: z.enum(["admin", "editor"]),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [registerUser, regState] = useRegisterMutation();
  const [login, loginState] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const { locked, lock } = useSubmitLock();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "", role: "admin" },
  });
  const role = watch("role");

  const onSubmit = async (v: Values) => {
    setFormError(null);
    const email = v.email.trim().toLowerCase();
    try {
      // POST /auth/register returns the user but no token…
      await registerUser({ name: v.name.trim(), email, password: v.password, role: v.role }).unwrap();
    } catch (e) {
      setFormError(getErrorMessage(e));
      return;
    }
    try {
      // …so sign in with the same credentials.
      const { token, user } = await login({ email, password: v.password }).unwrap();
      signIn(token, user);
      toast.success("Account created — welcome to Solvix");
      router.replace("/dashboard");
    } catch {
      router.replace(`/login?registered=1&email=${encodeURIComponent(email)}`);
    }
  };

  const busy = regState.isLoading || loginState.isLoading || loginState.isSuccess || locked;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted">Set up access to the Solvix dashboard.</p>
      </div>

      {formError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={lock(handleSubmit(onSubmit))} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Tahir Ahmed" leftIcon={<UserRound />} invalid={!!errors.name} className="h-10" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@soldevix.com" leftIcon={<Mail />} invalid={!!errors.email} className="h-10" {...register("email")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              leftIcon={<Lock />}
              invalid={!!errors.password}
              className="h-10"
              rightSlot={
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="rounded-md p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
              {...register("password")}
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
            <Input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" invalid={!!errors.confirm} className="h-10" {...register("confirm")} />
          </Field>
        </div>
        <Field label="Role" hint={role === "admin" ? "Admins manage websites, editors and integrations." : "Editors write blogs and manage media for assigned websites."}>
          <Segmented<Role>
            value={role}
            onChange={(r) => setValue("role", r)}
            items={[
              { value: "admin", label: "Admin" },
              { value: "editor", label: "Editor" },
            ]}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy} rightIcon={<ArrowRight />}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
