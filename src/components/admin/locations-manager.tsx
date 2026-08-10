"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createLocationAction,
  updateLocationAction,
  type StructureActionResult,
} from "@/lib/structure/actions";
import { slugifyOrganisationName } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Brand, Location } from "@/types/database";

const initial: StructureActionResult = { ok: false };

const LOCATION_TYPES = [
  "branch",
  "dealership",
  "office",
  "department",
  "division",
  "region",
  "team",
] as const;

export function LocationsManager({
  organisationId,
  brands,
  locations,
}: {
  organisationId: string;
  brands: Brand[];
  locations: Location[];
}) {
  const [editing, setEditing] = useState<Location | null>(null);
  const [createState, createAction, createPending] = useActionState(
    createLocationAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateLocationAction,
    initial,
  );

  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [b.id, b.name]));
    return (id: string) => map.get(id) ?? "Unknown brand";
  }, [brands]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form
        key={editing?.id ?? "new"}
        action={editing ? updateAction : createAction}
        className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        <input type="hidden" name="organisationId" value={organisationId} />
        {editing ? (
          <input type="hidden" name="locationId" value={editing.id} />
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {editing ? "Edit location" : "Add location"}
          </h2>
          <p className="text-sm text-[var(--brand-muted-text)]">
            Locations belong to a brand within the organisation.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brandId">Brand</Label>
          <select
            id="brandId"
            name="brandId"
            required
            defaultValue={editing?.brand_id ?? brands[0]?.id ?? ""}
            className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            disabled={brands.length === 0}
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={editing?.name ?? ""}
            onBlur={(e) => {
              const slugInput = document.getElementById(
                "location-slug",
              ) as HTMLInputElement | null;
              if (slugInput && !slugInput.value) {
                slugInput.value = slugifyOrganisationName(e.target.value);
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-slug">Slug</Label>
          <Input
            id="location-slug"
            name="slug"
            required
            defaultValue={editing?.slug ?? ""}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={editing?.type ?? "branch"}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              {LOCATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={editing?.status ?? "active"}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={editing?.address ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={editing?.email ?? ""}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={editing?.website ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={editing?.timezone ?? "Africa/Johannesburg"}
            />
          </div>
        </div>
        {(editing ? updateState.error : createState.error) ? (
          <p className="text-sm text-red-700">
            {editing ? updateState.error : createState.error}
          </p>
        ) : null}
        {(editing ? updateState.ok : createState.ok) ? (
          <p className="text-sm text-emerald-700">Saved.</p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={brands.length === 0 || createPending || updatePending}
          >
            {createPending || updatePending
              ? "Saving…"
              : editing
                ? "Update location"
                : "Add location"}
          </Button>
          {editing ? (
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Locations ({locations.length})
        </h2>
        <ul className="space-y-3">
          {locations.map((location) => (
            <li
              key={location.id}
              className="flex items-start justify-between gap-3 border-b border-[var(--brand-border)] pb-3 last:border-0"
            >
              <div>
                <p className="font-medium">{location.name}</p>
                <p className="text-sm text-[var(--brand-muted-text)]">
                  {brandName(location.brand_id)} · {location.type} ·{" "}
                  {location.status}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(location)}
              >
                Edit
              </Button>
            </li>
          ))}
          {locations.length === 0 ? (
            <li className="text-sm text-[var(--brand-muted-text)]">
              No locations yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
