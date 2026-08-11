import "server-only";

import { cookies } from "next/headers";

/** HttpOnly cookie - platform admins only may set via switch action. */
export const ACTIVE_ORGANISATION_COOKIE = "devision-active-organisation-id";

export async function readActiveOrganisationCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ACTIVE_ORGANISATION_COOKIE)?.value?.trim();
  return value || null;
}

export async function writeActiveOrganisationCookie(
  organisationId: string,
): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_ORGANISATION_COOKIE, organisationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
