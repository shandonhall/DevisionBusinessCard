import { z } from "zod";
import { slugSchema } from "@/lib/validation/auth";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalHttpUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .url()
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    }, "Only http(s) URLs are allowed")
    .optional()
    .nullable(),
);

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().email().optional().nullable(),
);

/**
 * Normalise phone numbers toward E.164 when possible.
 * Accepts international (+…) or national with a default country calling code.
 * Does not assume South Africa-only input.
 */
export function normalisePhoneE164(
  raw: string | null | undefined,
  defaultCountryCallingCode = "27",
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    return rest.length >= 8 ? `+${rest}` : null;
  }

  let national = digits.replace(/\D/g, "");
  if (national.startsWith("0")) {
    national = national.slice(1);
  }
  if (national.length < 7) return null;
  return `+${defaultCountryCallingCode}${national}`;
}

const optionalPhone = z.preprocess(emptyToUndefined, z.string().max(32).optional().nullable());

export const entityStatusSchema = z.enum(["draft", "active", "archived"]);
export const employeeStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "archived",
]);
export const locationTypeSchema = z.enum([
  "branch",
  "dealership",
  "office",
  "department",
  "division",
  "region",
  "team",
]);

export const createBrandSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  website: optionalHttpUrl,
  status: entityStatusSchema.default("active"),
});

export const updateBrandSchema = createBrandSchema.extend({
  brandId: z.string().uuid(),
});

export const createLocationSchema = z.object({
  organisationId: z.string().uuid(),
  brandId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  type: locationTypeSchema.default("branch"),
  address: z.preprocess(emptyToUndefined, z.string().max(500).optional().nullable()),
  phone: optionalPhone,
  email: optionalEmail,
  website: optionalHttpUrl,
  timezone: z.string().trim().min(2).max(80).default("Africa/Johannesburg"),
  status: entityStatusSchema.default("active"),
});

export const updateLocationSchema = createLocationSchema.extend({
  locationId: z.string().uuid(),
});

export const createEmployeeSchema = z.object({
  organisationId: z.string().uuid(),
  brandId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  locationId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  displayName: z.preprocess(emptyToUndefined, z.string().trim().max(160).optional().nullable()),
  jobTitle: z.preprocess(emptyToUndefined, z.string().trim().max(160).optional().nullable()),
  department: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional().nullable()),
  email: optionalEmail,
  mobile: optionalPhone,
  whatsapp: optionalPhone,
  linkedinUrl: optionalHttpUrl,
  bio: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional().nullable()),
  employeeReference: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(80).optional().nullable(),
  ),
  status: employeeStatusSchema.default("active"),
  defaultCountryCallingCode: z
    .string()
    .regex(/^\d{1,4}$/)
    .default("27"),
});

export const updateEmployeeSchema = createEmployeeSchema.extend({
  employeeId: z.string().uuid(),
});

/** Fields an employee may edit on their own linked profile. */
export const updateEmployeeSelfSchema = z.object({
  employeeId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  displayName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(160).optional().nullable(),
  ),
  jobTitle: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(160).optional().nullable(),
  ),
  department: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional().nullable(),
  ),
  email: optionalEmail,
  mobile: optionalPhone,
  whatsapp: optionalPhone,
  linkedinUrl: optionalHttpUrl,
  bio: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(2000).optional().nullable(),
  ),
  defaultCountryCallingCode: z
    .string()
    .regex(/^\d{1,4}$/)
    .default("27"),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeSelfInput = z.infer<typeof updateEmployeeSelfSchema>;
