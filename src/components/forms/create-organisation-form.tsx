"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createOrganisationForCurrentUserAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { slugifyOrganisationName } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function CreateOrganisationForm({
  defaultName = "",
}: {
  defaultName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createOrganisationForCurrentUserAction,
    initialState,
  );
  const [orgName, setOrgName] = useState(defaultName);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState(slugifyOrganisationName(defaultName));

  const suggestedSlug = useMemo(
    () => slugifyOrganisationName(orgName),
    [orgName],
  );

  return (
    <form action={formAction} className="space-y-4">
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
          Used in public card URLs, e.g. /your-slug/…
        </p>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create organisation"}
      </Button>
    </form>
  );
}
