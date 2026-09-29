import { z } from "zod";
import type { Editor } from "@/types";

const base = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  websites: z.array(z.string()),
  isActive: z.boolean(),
};

export const createEditorSchema = z
  .object({
    ...base,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const updateEditorSchema = z
  .object({
    ...base,
    password: z.string().refine((v) => !v || v.length >= 8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export type EditorFormValues = z.infer<typeof createEditorSchema>;

export function editorToForm(e?: Editor): EditorFormValues {
  return {
    name: e?.name ?? "",
    email: e?.email ?? "",
    websites: e?.websites.map((w) => w.id) ?? [],
    isActive: e?.isActive ?? true,
    password: "",
    confirmPassword: "",
  };
}

/** Request body for editors.create / editors.update — field names NEED BACKEND CONFIRMATION. */
export function toEditorPayload(v: EditorFormValues, mode: "create" | "edit"): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: v.name,
    email: v.email,
    role: "editor",
    websites: v.websites,
    isActive: v.isActive,
  };
  if (mode === "create" || v.password) body.password = v.password;
  return body;
}
