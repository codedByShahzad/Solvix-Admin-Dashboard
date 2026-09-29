import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/dashboard/Logo";
import { LoadingState } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

const POINTS = [
  "One dashboard for Topicler.com, Numoro.net and every site you add next",
  "Structured blog editor with SEO previews and publishing controls",
  "Cloudinary-backed media library shared across websites",
  "Admin and editor roles with website-level access",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[#0d0c1d] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgba(84,80,224,0.55), transparent 70%), radial-gradient(50% 50% at 90% 90%, rgba(139,124,246,0.35), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative [&_div]:!text-white [&_.text-subtle]:!text-white/60">
          <Logo />
        </div>
        <div className="relative max-w-lg">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white">
            Every website&apos;s content, managed from one place.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-white/75">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#a5a1ff]" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/40">© {new Date().getFullYear()} Soldevix Solutions</p>
      </div>

      {/* Form */}
      <div className="flex flex-col bg-surface">
        <div className="p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-12">
          <div className="w-full max-w-sm">
            <Suspense fallback={<LoadingState />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
