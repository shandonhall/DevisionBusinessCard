"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpUserAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

/**
 * Public account signup for staff who were added by an organisation admin.
 * Does not create organisations or grant organisation_admin.
 */
export function SignUpForm({ signInHref = "/auth/sign-in" }: { signInHref?: string }) {
  const [state, formAction, pending] = useActionState(
    signUpUserAction,
    initialState,
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
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-[var(--brand-muted-text)]">
        Already have an account?{" "}
        <Link
          href={signInHref}
          className="font-medium text-[var(--brand-primary)]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
