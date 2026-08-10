import { z } from "zod";

export const RESERVED_ORG_SLUGS = [
  "admin",
  "dashboard",
  "api",
  "auth",
  "privacy",
  "terms",
  "login",
  "signup",
  "platform",
  "health",
] as const;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens")
  .refine((value) => !RESERVED_ORG_SLUGS.includes(value as (typeof RESERVED_ORG_SLUGS)[number]), {
    message: "That slug is reserved",
  });

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  organisationName: z.string().trim().min(2).max(120),
  organisationSlug: slugSchema,
});

export const createOrganisationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  legalName: z.string().trim().max(160).optional().nullable(),
  website: z
    .string()
    .trim()
    .url()
    .optional()
    .nullable()
    .or(z.literal("")),
});

export function slugifyOrganisationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
