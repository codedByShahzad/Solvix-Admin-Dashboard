"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

export function CopyButton({
  value,
  label,
  size = "icon-sm",
  variant = "ghost",
  toastMessage = "Copied to clipboard",
}: {
  value: string;
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  toastMessage?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastMessage);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access.");
    }
  };
  return (
    <Button variant={variant} size={label ? "sm" : size} onClick={copy} aria-label={label ?? "Copy"} leftIcon={copied ? <Check /> : <Copy />}>
      {label}
    </Button>
  );
}
