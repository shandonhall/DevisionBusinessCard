"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";
import { slugifyOrganisationName } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

/**
 * Platform-only tenant + first admin signup.
 * Kept off client-facing AGG login / user signup screens.
 */
export function CreateOrganisationSignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [orgName, setOrgName] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");

  const suggestedSlug = useMemo(
    () => slugifyOrganisationName(orgName),
    [orgName],
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" name="fullName" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organisationName">Organisation name</Label>
        <Input
          id="organisationName"
          name="organisationName"
          required
          value={orgName}
          onChange={(e) => {
            setOrgName(e.target.value);
            if (!slugTouched) setSlug(slugifyOrganisationName(e.target.value));
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organisationSlug">Organisation slug</Label>
        <Input
          id="organisationSlug"
          name="organisationSlug"
          required
          value={slugTouched ? slug : suggestedSlug || slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <p className="text-xs text-[var(--brand-muted-text)]">
          Used in public URLs later, e.g. /your-slug/…
        </p>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create organisation"}
      </Button>
      <p className="text-center text-sm text-[var(--brand-muted-text)]">
        Already have an account?{" "}
        <Link
          href="/auth/sign-in"
          className="font-medium text-[var(--brand-primary)]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
