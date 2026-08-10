import { z } from "zod";
import { FONT_OPTIONS } from "@/lib/branding/tokens";

const hexColour = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use a 6-digit hex colour like #0F766E");

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalHttpUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .url()
    .refine(
      (value) => {
        try {
          const protocol = new URL(value).protocol;
          return protocol === "https:" || protocol === "http:";
        } catch {
          return false;
        }
      },
      { message: "Only http(s) URLs are allowed" },
    )
    .optional()
    .nullable(),
);

export const updateOrganisationSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  legalName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(160).optional().nullable(),
  ),
  website: optionalHttpUrl,
});

export const updateBrandKitSchema = z.object({
  brandKitId: z.string().uuid(),
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  primaryColour: hexColour,
  secondaryColour: hexColour,
  accentColour: hexColour,
  backgroundColour: hexColour,
  surfaceColour: hexColour,
  textColour: hexColour,
  mutedTextColour: hexColour,
  headingFont: z.enum(FONT_OPTIONS),
  bodyFont: z.enum(FONT_OPTIONS),
  buttonRadius: z.string().regex(/^\d{1,3}px$/),
  cardRadius: z.string().regex(/^\d{1,3}px$/),
  defaultLayoutId: z.enum(["executive", "corporate", "modern"]),
  logoUrl: optionalHttpUrl,
});

export const ALLOWED_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export const importBrandFromWebsiteSchema = z.object({
  organisationId: z.string().uuid(),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    }, "Only http(s) URLs are allowed"),
});

export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
export type UpdateBrandKitInput = z.infer<typeof updateBrandKitSchema>;
export type ImportBrandFromWebsiteInput = z.infer<
  typeof importBrandFromWebsiteSchema
>;
