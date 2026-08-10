"use server";

import { revalidatePath } from "next/cache";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import {
  archiveEmployee,
  createBrand,
  createEmployee,
  createLocation,
  updateBrand,
  updateEmployee,
  updateLocation,
} from "@/lib/db/structure";
import { uploadEmployeeProfilePhoto } from "@/lib/db/employee-photo";
import {
  claimEmployeeProfileForCurrentUser,
  getEmployeeForUser,
  linkEmployeeToUserByEmail,
  updateEmployeeSelfProfile,
} from "@/lib/db/employee-self";
import { getCardByEmployee } from "@/lib/db/cards";

export type StructureActionResult = {
  ok: boolean;
  error?: string;
  photoUrl?: string;
};

async function runAdminAction(
  organisationId: string,
  work: () => Promise<void>,
): Promise<StructureActionResult> {
  try {
    await requireOrganisationAdmin(organisationId);
    await work();
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/brands");
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard/my-card");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Action failed",
    };
  }
}

export async function createBrandAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await createBrand({
      organisationId,
      name: formData.get("name"),
      slug: formData.get("slug"),
      website: formData.get("website"),
      logoUrl: formData.get("logoUrl"),
      status: formData.get("status") || "active",
    });
  });
}

export async function updateBrandAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await updateBrand({
      organisationId,
      brandId: formData.get("brandId"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      website: formData.get("website"),
      logoUrl: formData.get("logoUrl"),
      status: formData.get("status") || "active",
    });
  });
}

export async function createLocationAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await createLocation({
      organisationId,
      brandId: formData.get("brandId"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      type: formData.get("type") || "branch",
      address: formData.get("address"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      website: formData.get("website"),
      timezone: formData.get("timezone") || "Africa/Johannesburg",
      status: formData.get("status") || "active",
    });
  });
}

export async function updateLocationAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await updateLocation({
      organisationId,
      locationId: formData.get("locationId"),
      brandId: formData.get("brandId"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      type: formData.get("type") || "branch",
      address: formData.get("address"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      website: formData.get("website"),
      timezone: formData.get("timezone") || "Africa/Johannesburg",
      status: formData.get("status") || "active",
    });
  });
}

export async function createEmployeeAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await createEmployee({
      organisationId,
      brandId: formData.get("brandId"),
      locationId: formData.get("locationId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      displayName: formData.get("displayName"),
      jobTitle: formData.get("jobTitle"),
      department: formData.get("department"),
      email: formData.get("email"),
      mobile: formData.get("mobile"),
      whatsapp: formData.get("whatsapp"),
      linkedinUrl: formData.get("linkedinUrl"),
      bio: formData.get("bio"),
      employeeReference: formData.get("employeeReference"),
      status: formData.get("status") || "active",
      defaultCountryCallingCode:
        formData.get("defaultCountryCallingCode") || "27",
    });
  });
}

export async function updateEmployeeAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await updateEmployee({
      organisationId,
      employeeId: formData.get("employeeId"),
      brandId: formData.get("brandId"),
      locationId: formData.get("locationId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      displayName: formData.get("displayName"),
      jobTitle: formData.get("jobTitle"),
      department: formData.get("department"),
      email: formData.get("email"),
      mobile: formData.get("mobile"),
      whatsapp: formData.get("whatsapp"),
      linkedinUrl: formData.get("linkedinUrl"),
      bio: formData.get("bio"),
      employeeReference: formData.get("employeeReference"),
      status: formData.get("status") || "active",
      defaultCountryCallingCode:
        formData.get("defaultCountryCallingCode") || "27",
    });

    const linkLogin = String(formData.get("linkLogin") || "") === "on";
    const email = String(formData.get("email") || "").trim();
    if (linkLogin && email) {
      await linkEmployeeToUserByEmail({
        organisationId,
        employeeId: String(formData.get("employeeId") || ""),
        email,
      });
    }
  });
}

export async function uploadEmployeePhotoAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  try {
    const organisationId = String(formData.get("organisationId") || "");
    const employeeId = String(formData.get("employeeId") || "");
    const file = formData.get("photo");
    await requireOrganisationAdmin(organisationId);

    if (!(file instanceof File)) {
      return { ok: false, error: "Choose a photo to upload." };
    }

    const photoUrl = await uploadEmployeeProfilePhoto({
      organisationId,
      employeeId,
      file,
    });

    const card = await getCardByEmployee(organisationId, employeeId);
    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard/my-card");
    revalidatePath("/dashboard/cards");
    if (card) {
      revalidatePath(`/dashboard/cards/${card.id}/preview`);
    }
    return { ok: true, photoUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function archiveEmployeeAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return runAdminAction(organisationId, async () => {
    await archiveEmployee({
      organisationId,
      employeeId: String(formData.get("employeeId") || ""),
    });
  });
}

export async function updateMyCardAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  try {
    const context = await requireAuthContext();
    const employee = await updateEmployeeSelfProfile(context.userId, {
      employeeId: formData.get("employeeId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      displayName: formData.get("displayName"),
      jobTitle: formData.get("jobTitle"),
      department: formData.get("department"),
      email: formData.get("email"),
      mobile: formData.get("mobile"),
      whatsapp: formData.get("whatsapp"),
      linkedinUrl: formData.get("linkedinUrl"),
      bio: formData.get("bio"),
      defaultCountryCallingCode:
        formData.get("defaultCountryCallingCode") || "27",
    });

    const card = await getCardByEmployee(employee.organisation_id, employee.id);
    revalidatePath("/dashboard/my-card");
    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard/cards");
    if (card) {
      revalidatePath(`/dashboard/cards/${card.id}/preview`);
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function uploadMyPhotoAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  try {
    const context = await requireAuthContext();
    const employee = await getEmployeeForUser(context.userId);
    if (!employee) {
      return { ok: false, error: "No employee profile linked to your account." };
    }

    const file = formData.get("photo");
    if (!(file instanceof File)) {
      return { ok: false, error: "Choose a photo to upload." };
    }

    const photoUrl = await uploadEmployeeProfilePhoto({
      organisationId: employee.organisation_id,
      employeeId: employee.id,
      file,
    });

    const card = await getCardByEmployee(employee.organisation_id, employee.id);
    revalidatePath("/dashboard/my-card");
    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard/cards");
    if (card) {
      revalidatePath(`/dashboard/cards/${card.id}/preview`);
      const organisation = await getPrimaryOrganisation(context);
      if (organisation) {
        revalidatePath(`/${organisation.slug}/${card.slug}`);
        revalidatePath(`/${organisation.slug}/${card.slug}/qr`);
      }
    }
    return { ok: true, photoUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function claimMyCardAction(
  _prev: StructureActionResult,
  formData: FormData,
): Promise<StructureActionResult> {
  void _prev;
  void formData;
  try {
    await requireAuthContext();
    const employee = await claimEmployeeProfileForCurrentUser();
    revalidatePath("/dashboard/my-card");
    revalidatePath("/dashboard");
    if (!employee) {
      return {
        ok: false,
        error:
          "No matching employee record found for your email. Ask an admin to add you on Team with this email, then try again.",
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Claim failed",
    };
  }
}
