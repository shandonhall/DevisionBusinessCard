"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completePendingOrganisationSetup } from "@/lib/auth/complete-org-setup";
import { createOrganisationWithAdminMembership } from "@/lib/db/organisations";
import { claimEmployeeProfileForCurrentUser } from "@/lib/db/employee-self";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";
import {
  createOrganisationSchema,
  changePasswordSchema,
  signInSchema,
  signUpSchema,
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
 * Public user signup. Creates an auth account only — no organisation,
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
    return { error: "Signup failed — no user returned" };
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
 * Platform-only tenant onboarding. Creates org + organisation_admin.
 * Not linked from client / AGG sign-in screens.
 */
export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const configError = requireSupabaseConfigured();
  if (configError) return configError;

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    organisationName: formData.get("organisationName"),
    organisationSlug: formData.get("organisationSlug"),
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
        organisation_name: parsed.data.organisationName,
        organisation_slug: parsed.data.organisationSlug,
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Signup failed — no user returned" };
  }

  if (data.session) {
    try {
      await createOrganisationWithAdminMembership({
        userId: data.user.id,
        name: parsed.data.organisationName,
        slug: parsed.data.organisationSlug,
      });
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "Account created but organisation setup failed",
      };
    }
    redirect("/dashboard");
  }

  return {
    success:
      "Check your email to confirm your account. After you confirm and sign in, your organisation will be set up automatically.",
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

  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "You already belong to an organisation" };
  }

  try {
    await createOrganisationWithAdminMembership({
      userId: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to create organisation",
    };
  }

  redirect("/dashboard");
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
