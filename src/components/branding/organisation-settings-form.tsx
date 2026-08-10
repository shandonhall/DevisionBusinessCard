"use client";

import { useActionState } from "react";
import {
  updateOrganisationAction,
  type ActionResult,
} from "@/lib/branding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organisation } from "@/types/database";

const initial: ActionResult = { ok: false };

export function OrganisationSettingsForm({
  organisation,
}: {
  organisation: Organisation;
}) {
  const [state, action, pending] = useActionState(
    updateOrganisationAction,
    initial,
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
    >
      <input type="hidden" name="organisationId" value={organisation.id} />
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Organisation</h2>
        <p className="text-sm text-[var(--brand-muted-text)]">
          Slug <code>/{organisation.slug}</code> is fixed for now (redirects
          land in a later milestone).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={organisation.name}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="legalName">Legal name</Label>
        <Input
          id="legalName"
          name="legalName"
          defaultValue={organisation.legal_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={organisation.website ?? ""}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700">Organisation saved.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save organisation"}
      </Button>
    </form>
  );
}
