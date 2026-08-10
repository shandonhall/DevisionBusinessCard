"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completePendingOrganisationSetup } from "@/lib/auth/complete-org-setup";
import { createOrganisationWithAdminMembership } from "@/lib/db/organisations";
import {
  createOrganisationSchema,
  signInSchema,
  signUpSchema,
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
      await completePendingOrganisationSetup(data.user);
    } catch {
      // Dashboard can still create an organisation manually.
    }
  }

  redirect("/dashboard");
}

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

  // If email confirmation is disabled, session exists and we can create the org now.
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

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
