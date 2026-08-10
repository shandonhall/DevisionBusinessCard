"use client";

import { switchActiveOrganisationAction } from "@/lib/auth/switch-organisation";

export function OrganisationSwitcher({
  organisations,
  currentOrganisationId,
}: {
  organisations: Array<{ id: string; name: string; slug: string }>;
  currentOrganisationId: string | null;
}) {
  if (organisations.length === 0) return null;

  return (
    <form action={switchActiveOrganisationAction} className="min-w-0">
      <label className="sr-only" htmlFor="active-organisation">
        Active organisation
      </label>
      <select
        id="active-organisation"
        name="organisationId"
        defaultValue={currentOrganisationId ?? organisations[0]?.id}
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
        className="max-w-[10.5rem] truncate rounded-md border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-2 py-1.5 text-xs font-medium text-[var(--brand-text)] sm:max-w-[14rem] sm:text-sm"
      >
        {organisations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </form>
  );
}
