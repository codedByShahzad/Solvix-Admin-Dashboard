"use client";

import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { makeStore, type AppStore } from "@/store/store";
import { AuthBootstrap } from "./AuthBootstrap";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      toastOptions={{ classNames: { toast: "!rounded-xl !font-sans !text-[13px]" } }}
    />
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthBootstrap />
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </Provider>
  );
}
