"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      hideClose
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 pt-3">
        <span
          className={
            tone === "danger"
              ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger"
              : "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
          }
        >
          <AlertTriangle className="size-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
          {description && <div className="mt-1.5 text-sm leading-relaxed text-muted">{description}</div>}
        </div>
      </div>
    </Modal>
  );
}
