import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Brand, Employee, Location } from "@/types/database";
import {
  createBrandSchema,
  createEmployeeSchema,
  createLocationSchema,
  normalisePhoneE164,
  updateBrandSchema,
  updateEmployeeSchema,
  updateLocationSchema,
} from "@/lib/validation/structure";
import { ensureDefaultBrandKit } from "@/lib/db/branding";
import { ensureCardForEmployee } from "@/lib/db/cards";

export async function listBrands(organisationId: string): Promise<Brand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listLocations(organisationId: string): Promise<Location[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listEmployees(organisationId: string): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBrand(input: unknown): Promise<Brand> {
  const parsed = createBrandSchema.parse(input);
  const supabase = await createClient();

  const { data: brand, error } = await supabase
    .from("brands")
    .insert({
      organisation_id: parsed.organisationId,
      name: parsed.name,
      slug: parsed.slug,
      website: parsed.website || null,
      status: parsed.status,
    })
    .select("*")
    .single();

  if (error || !brand) {
    throw new Error(error?.message ?? "Failed to create brand");
  }

  // Seed a brand-scoped kit cloned from organisation defaults when available.
  try {
    const orgKit = await ensureDefaultBrandKit(parsed.organisationId);
    const { data: brandKit } = await supabase
      .from("brand_kits")
      .insert({
        organisation_id: parsed.organisationId,
        brand_id: brand.id,
        name: `${parsed.name} kit`,
        primary_colour: orgKit.primary_colour,
        secondary_colour: orgKit.secondary_colour,
        accent_colour: orgKit.accent_colour,
        background_colour: orgKit.background_colour,
        surface_colour: orgKit.surface_colour,
        text_colour: orgKit.text_colour,
        muted_text_colour: orgKit.muted_text_colour,
        heading_font: orgKit.heading_font,
        body_font: orgKit.body_font,
        button_radius: orgKit.button_radius,
        card_radius: orgKit.card_radius,
        default_layout_id: orgKit.default_layout_id,
        logo_url: orgKit.logo_url,
      })
      .select("id")
      .single();

    if (brandKit) {
      await supabase
        .from("brands")
        .update({ brand_kit_id: brandKit.id })
        .eq("id", brand.id);
      brand.brand_kit_id = brandKit.id;
    }
  } catch {
    // Brand remains usable without a dedicated kit.
  }

  return brand;
}

export async function updateBrand(input: unknown): Promise<Brand> {
  const parsed = updateBrandSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .update({
      name: parsed.name,
      slug: parsed.slug,
      website: parsed.website || null,
      status: parsed.status,
    })
    .eq("id", parsed.brandId)
    .eq("organisation_id", parsed.organisationId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update brand");
  return data;
}

export async function createLocation(input: unknown): Promise<Location> {
  const parsed = createLocationSchema.parse(input);
  const supabase = await createClient();

  // Ensure brand belongs to the same organisation (defence in depth beyond RLS).
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", parsed.brandId)
    .eq("organisation_id", parsed.organisationId)
    .maybeSingle();
  if (!brand) throw new Error("Brand not found in this organisation");

  const { data, error } = await supabase
    .from("locations")
    .insert({
      organisation_id: parsed.organisationId,
      brand_id: parsed.brandId,
      name: parsed.name,
      slug: parsed.slug,
      type: parsed.type,
      address: parsed.address || null,
      phone: normalisePhoneE164(parsed.phone),
      email: parsed.email || null,
      website: parsed.website || null,
      timezone: parsed.timezone,
      status: parsed.status,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create location");
  }
  return data;
}

export async function updateLocation(input: unknown): Promise<Location> {
  const parsed = updateLocationSchema.parse(input);
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", parsed.brandId)
    .eq("organisation_id", parsed.organisationId)
    .maybeSingle();
  if (!brand) throw new Error("Brand not found in this organisation");

  const { data, error } = await supabase
    .from("locations")
    .update({
      brand_id: parsed.brandId,
      name: parsed.name,
      slug: parsed.slug,
      type: parsed.type,
      address: parsed.address || null,
      phone: normalisePhoneE164(parsed.phone),
      email: parsed.email || null,
      website: parsed.website || null,
      timezone: parsed.timezone,
      status: parsed.status,
    })
    .eq("id", parsed.locationId)
    .eq("organisation_id", parsed.organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update location");
  }
  return data;
}

async function assertBrandLocationBelongToOrg(params: {
  organisationId: string;
  brandId?: string | null;
  locationId?: string | null;
}) {
  const supabase = await createClient();

  if (params.brandId) {
    const { data } = await supabase
      .from("brands")
      .select("id")
      .eq("id", params.brandId)
      .eq("organisation_id", params.organisationId)
      .maybeSingle();
    if (!data) throw new Error("Brand not found in this organisation");
  }

  if (params.locationId) {
    const { data } = await supabase
      .from("locations")
      .select("id, brand_id")
      .eq("id", params.locationId)
      .eq("organisation_id", params.organisationId)
      .maybeSingle();
    if (!data) throw new Error("Location not found in this organisation");
    if (params.brandId && data.brand_id !== params.brandId) {
      throw new Error("Location does not belong to the selected brand");
    }
  }
}

export async function createEmployee(input: unknown): Promise<Employee> {
  const parsed = createEmployeeSchema.parse(input);
  await assertBrandLocationBelongToOrg({
    organisationId: parsed.organisationId,
    brandId: parsed.brandId,
    locationId: parsed.locationId,
  });

  const supabase = await createClient();
  const displayName =
    parsed.displayName ||
    `${parsed.firstName} ${parsed.lastName}`.trim();

  const { data, error } = await supabase
    .from("employees")
    .insert({
      organisation_id: parsed.organisationId,
      brand_id: parsed.brandId || null,
      location_id: parsed.locationId || null,
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      display_name: displayName,
      job_title: parsed.jobTitle || null,
      department: parsed.department || null,
      email: parsed.email || null,
      mobile: normalisePhoneE164(
        parsed.mobile,
        parsed.defaultCountryCallingCode,
      ),
      whatsapp: normalisePhoneE164(
        parsed.whatsapp,
        parsed.defaultCountryCallingCode,
      ),
      linkedin_url: parsed.linkedinUrl || null,
      bio: parsed.bio || null,
      employee_reference: parsed.employeeReference || null,
      status: parsed.status,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create employee");
  }

  try {
    await ensureCardForEmployee({
      organisationId: parsed.organisationId,
      employee: data,
      publicStatus: "draft",
    });
  } catch {
    // Employee remains valid; cards can be published from /dashboard/cards.
  }

  return data;
}

export async function updateEmployee(input: unknown): Promise<Employee> {
  const parsed = updateEmployeeSchema.parse(input);
  await assertBrandLocationBelongToOrg({
    organisationId: parsed.organisationId,
    brandId: parsed.brandId,
    locationId: parsed.locationId,
  });

  const supabase = await createClient();
  const displayName =
    parsed.displayName ||
    `${parsed.firstName} ${parsed.lastName}`.trim();

  const { data, error } = await supabase
    .from("employees")
    .update({
      brand_id: parsed.brandId || null,
      location_id: parsed.locationId || null,
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      display_name: displayName,
      job_title: parsed.jobTitle || null,
      department: parsed.department || null,
      email: parsed.email || null,
      mobile: normalisePhoneE164(
        parsed.mobile,
        parsed.defaultCountryCallingCode,
      ),
      whatsapp: normalisePhoneE164(
        parsed.whatsapp,
        parsed.defaultCountryCallingCode,
      ),
      linkedin_url: parsed.linkedinUrl || null,
      bio: parsed.bio || null,
      employee_reference: parsed.employeeReference || null,
      status: parsed.status,
    })
    .eq("id", parsed.employeeId)
    .eq("organisation_id", parsed.organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update employee");
  }
  return data;
}

export async function archiveEmployee(params: {
  organisationId: string;
  employeeId: string;
}): Promise<Employee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .update({ status: "archived" })
    .eq("id", params.employeeId)
    .eq("organisation_id", params.organisationId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to archive employee");
  }
  return data;
}
