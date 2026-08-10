import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";
import {
  normalisePhoneE164,
  updateEmployeeSelfSchema,
} from "@/lib/validation/structure";

export async function getEmployeeForUser(
  userId: string,
): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Links employee.user_id when email matches; creates employee membership if needed. */
export async function claimEmployeeProfileForCurrentUser(): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_employee_profile");
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("*")
    .eq("id", data)
    .maybeSingle();
  if (empError) throw new Error(empError.message);
  return employee;
}

export async function updateEmployeeSelfProfile(
  userId: string,
  input: unknown,
): Promise<Employee> {
  const parsed = updateEmployeeSelfSchema.parse(input);
  const supabase = await createClient();

  const existing = await getEmployeeForUser(userId);
  if (!existing || existing.id !== parsed.employeeId) {
    throw new Error("You can only edit your own profile");
  }

  const displayName =
    parsed.displayName ||
    `${parsed.firstName} ${parsed.lastName}`.trim();

  const { data, error } = await supabase
    .from("employees")
    .update({
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
    })
    .eq("id", parsed.employeeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update profile");
  }
  return data;
}

export async function linkEmployeeToUserByEmail(params: {
  organisationId: string;
  employeeId: string;
  email: string;
}): Promise<Employee> {
  const supabase = await createClient();
  const email = params.email.trim().toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) {
    throw new Error(
      "No login account found for that email yet. Ask them to sign up first, then link again.",
    );
  }

  const { data: conflict } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", profile.id)
    .neq("id", params.employeeId)
    .maybeSingle();

  if (conflict) {
    throw new Error("That login is already linked to another employee.");
  }

  const { data, error } = await supabase
    .from("employees")
    .update({ user_id: profile.id, email: params.email.trim() })
    .eq("id", params.employeeId)
    .eq("organisation_id", params.organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to link login");
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    user_id: profile.id,
    organisation_id: params.organisationId,
    role: "employee",
  });
  if (membershipError && !/duplicate|unique/i.test(membershipError.message)) {
    throw new Error(membershipError.message);
  }

  return data;
}
