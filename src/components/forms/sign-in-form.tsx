"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function SignInForm({
  signUpHref = "/auth/sign-up",
}: {
  signUpHref?: string;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-[var(--brand-muted-text)]">
        Need an account?{" "}
        <Link
          href={signUpHref}
          className="font-medium text-[var(--brand-primary)]"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
