import { z } from "zod";

/** POST /auth/register with role "editor" + optional website assignments. */
export const createEditorSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    websites: z.array(z.string()),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export type EditorFormValues = z.infer<typeof createEditorSchema>;

export const emptyEditorForm: EditorFormValues = { name: "", email: "", password: "", confirmPassword: "", websites: [] };
