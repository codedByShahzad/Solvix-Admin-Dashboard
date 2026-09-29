import { z } from "zod";
import type { Website } from "@/types";

export const WEBSITE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

export const websiteSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Keep the name under 80 characters"),
  domain: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .transform((v) => v.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase())
    .refine((v) => DOMAIN_RE.test(v), "Enter a valid domain, e.g. topicler.com"),
  description: z.string().trim().max(500, "Keep the description under 500 characters"),
  status: z.string().min(1),
});

export type WebsiteFormInput = z.input<typeof websiteSchema>;
export type WebsiteFormValues = z.output<typeof websiteSchema>;

export function websiteToForm(w?: Website): WebsiteFormInput {
  return {
    name: w?.name ?? "",
    domain: w?.domain ?? "",
    description: w?.description ?? "",
    status: w?.status ?? "active",
  };
}

/** Request body for websites.create / websites.update — field names NEED BACKEND CONFIRMATION. */
export function toWebsitePayload(v: WebsiteFormValues): Record<string, unknown> {
  return { name: v.name, domain: v.domain, description: v.description || undefined, status: v.status };
}
