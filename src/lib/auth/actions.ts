"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { writeActiveOrganisationCookie } from "@/lib/auth/active-organisation";
import { completePendingOrganisationSetup } from "@/lib/auth/complete-org-setup";
import { createOrganisationWithAdminMembership } from "@/lib/db/organisations";
import { claimEmployeeProfileForCurrentUser } from "@/lib/db/employee-self";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";
import {
  createOrganisationSchema,
  changePasswordSchema,
  signInSchema,
  userSignUpSchema,
} from "@/lib/validation/auth";
import { getServerEnv, hasSupabasePublicConfig } from "@/lib/validation/env";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function requireSupabaseConfigured(): AuthActionState | null {
  if (!hasSupabasePublicConfig()) {
    return {
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }
  return null;
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const configError = requireSupabaseConfigured();
  if (configError) return configError;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    try {
      // Only completes org bootstrap when signup metadata included org fields
      // (platform create-organisation flow). Never invents admin access.
      await completePendingOrganisationSetup(data.user);
    } catch {
      // Dashboard can still show a contact-admin empty state.
    }

    try {
      await claimEmployeeProfileForCurrentUser();
    } catch {
      // Optional: employee rows are claimed when email matches Team.
    }
  }

  redirect("/dashboard");
}

/**
 * Public user signup. Creates an auth account only - no organisation,
 * no organisation_admin membership. Admins invite staff via Team first;
 * matching email claims the employee profile after sign-in.
 */
export async function signUpUserAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const configError = requireSupabaseConfigured();
  if (configError) return configError;

  const parsed = userSignUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const env = getServerEnv();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Signup failed - no user returned" };
  }

  if (data.session) {
    try {
      await claimEmployeeProfileForCurrentUser();
    } catch {
      // User can still browse a limited dashboard until an admin adds them.
    }
    redirect("/dashboard");
  }

  return {
    success:
      "Check your email to confirm your account, then sign in. If your admin already added you on Team with this email, your card profile will link automatically.",
  };
}

/**
 * @deprecated Public self-serve tenant signup is disabled.
 * Platform Admins create organisations while signed in via
 * /auth/create-organisation (createOrganisationForCurrentUserAction).
 */
export async function signUpAction(
  _prev: AuthActionState,
  _formData: FormData,
): Promise<AuthActionState> {
  return {
    error:
      "Organisation creation is restricted to DeVision Platform Admins. Sign in as a platform operator and use Create organisation.",
  };
}

export async function createOrganisationForCurrentUserAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const configError = requireSupabaseConfigured();
  if (configError) return configError;

  const parsed = createOrganisationSchema.safeParse({
    name: formData.get("organisationName"),
    slug: formData.get("organisationSlug"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid organisation" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !canAccessPlatformAdmin({
      is_platform_admin: profile.is_platform_admin,
      status: profile.status,
    })
  ) {
    return {
      error:
        "Only platform operators can create organisations. Ask your admin to invite you.",
    };
  }

  try {
    const organisation = await createOrganisationWithAdminMembership({
      userId: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
    });
    await writeActiveOrganisationCookie(organisation.id);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to create organisation",
    };
  }

  redirect("/admin");
}

export async function changePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const configError = requireSupabaseConfigured();
  if (configError) return configError;

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { error: "You must be signed in to change your password" };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (reauthError) {
    return { error: "Current password is incorrect" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: "Password updated successfully." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
