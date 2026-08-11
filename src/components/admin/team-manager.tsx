"use client";

import { useActionState, useMemo, useState } from "react";
import {
  archiveEmployeeAction,
  createEmployeeAction,
  updateEmployeeAction,
  uploadEmployeePhotoAction,
  type StructureActionResult,
} from "@/lib/structure/actions";
import { filterEmployees } from "@/lib/db/employee-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Brand, Employee, Location } from "@/types/database";

const initial: StructureActionResult = { ok: false };

export function TeamManager({
  organisationId,
  brands,
  locations,
  employees,
}: {
  organisationId: string;
  brands: Brand[];
  locations: Location[];
  employees: Employee[];
}) {
  const [editing, setEditing] = useState<Employee | null>(null);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  // Default to all statuses so draft demo staff (e.g. CMH Ford) are visible.
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.id ?? "");

  const [createState, createAction, createPending] = useActionState(
    createEmployeeAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateEmployeeAction,
    initial,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveEmployeeAction,
    initial,
  );
  const [photoState, photoAction, photoPending] = useActionState(
    uploadEmployeePhotoAction,
    initial,
  );

  const filteredLocations = useMemo(
    () =>
      locations.filter((location) =>
        selectedBrand ? location.brand_id === selectedBrand : true,
      ),
    [locations, selectedBrand],
  );

  const visible = useMemo(
    () =>
      filterEmployees(employees, {
        query,
        brandId: brandFilter || null,
        locationId: locationFilter || null,
        status: statusFilter || null,
      }),
    [employees, query, brandFilter, locationFilter, statusFilter],
  );

  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [b.id, b.name]));
    return (id: string | null) => (id ? map.get(id) ?? "-" : "-");
  }, [brands]);

  const locationName = useMemo(() => {
    const map = new Map(locations.map((l) => [l.id, l.name]));
    return (id: string | null) => (id ? map.get(id) ?? "-" : "-");
  }, [locations]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 md:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, title, email…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filterBrand">Brand</Label>
          <select
            id="filterBrand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filterLocation">Location</Label>
          <select
            id="filterLocation"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
          >
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filterStatus">Status</Label>
          <select
            id="filterStatus"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
        <form
          key={editing?.id ?? "new"}
          action={editing ? updateAction : createAction}
          className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
        >
          <input type="hidden" name="organisationId" value={organisationId} />
          {editing ? (
            <input type="hidden" name="employeeId" value={editing.id} />
          ) : null}
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {editing ? "Edit employee" : "Add employee"}
            </h2>
            <p className="text-sm text-[var(--brand-muted-text)]">
              Assign brand and location for correct inheritance later.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={editing?.first_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                defaultValue={editing?.last_name ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              defaultValue={editing?.job_title ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <select
                id="brandId"
                name="brandId"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <select
                id="locationId"
                name="locationId"
                defaultValue={editing?.location_id ?? ""}
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {(editing
                  ? locations.filter(
                      (l) =>
                        !editing.brand_id || l.brand_id === editing.brand_id,
                    )
                  : filteredLocations
                ).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editing?.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                name="mobile"
                defaultValue={editing?.mobile ?? ""}
                placeholder="+27…"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={editing?.whatsapp ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                defaultValue={editing?.linkedin_url ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                defaultValue={editing?.department ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeReference">Employee reference</Label>
              <Input
                id="employeeReference"
                name="employeeReference"
                defaultValue={editing?.employee_reference ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={editing?.bio ?? ""}
              className="w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 py-2 text-sm"
            />
          </div>
          {editing ? (
            <div className="space-y-3 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-hover)] p-3">
              <div className="flex items-center gap-3">
                {editing.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editing.profile_photo_url}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-xs text-[var(--brand-muted-text)]">
                    No photo
                  </div>
                )}
                <div className="text-sm text-[var(--brand-muted-text)]">
                  {editing.user_id
                    ? "Login linked - they can edit via My card."
                    : "Not linked to a login yet."}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="linkLogin" />
                Link login for this email (account must already exist)
              </label>
            </div>
          ) : null}
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
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <input type="hidden" name="defaultCountryCallingCode" value="27" />
          {(editing ? updateState.error : createState.error) ? (
            <p className="text-sm text-red-700">
              {editing ? updateState.error : createState.error}
            </p>
          ) : null}
          {(editing ? updateState.ok : createState.ok) ? (
            <p className="text-sm text-emerald-700">Saved.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createPending || updatePending}>
              {createPending || updatePending
                ? "Saving…"
                : editing
                  ? "Update employee"
                  : "Add employee"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        {editing ? (
          <form
            action={photoAction}
            className="space-y-3 rounded-[var(--brand-card-radius)] border border-dashed border-[var(--brand-border-strong)] bg-[var(--brand-surface)] p-5"
          >
            <input type="hidden" name="organisationId" value={organisationId} />
            <input type="hidden" name="employeeId" value={editing.id} />
            <div>
              <h3 className="font-medium tracking-tight">Profile photo</h3>
              <p className="text-sm text-[var(--brand-muted-text)]">
                PNG, JPEG or WebP · max 5MB. Shows on the public card.
              </p>
            </div>
            <Input
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
            />
            <Button type="submit" variant="secondary" disabled={photoPending}>
              {photoPending ? "Uploading…" : "Upload photo"}
            </Button>
            {photoState.error ? (
              <p className="text-sm text-red-700">{photoState.error}</p>
            ) : null}
            {photoState.ok ? (
              <p className="text-sm text-emerald-700">Photo updated.</p>
            ) : null}
          </form>
        ) : null}
        </div>

        <div className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Team ({visible.length})
          </h2>
          <ul className="space-y-3">
            {visible.map((employee) => (
              <li
                key={employee.id}
                className="space-y-2 border-b border-[var(--brand-border)] pb-3 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {employee.display_name ||
                        `${employee.first_name} ${employee.last_name}`}
                    </p>
                    <p className="text-sm text-[var(--brand-muted-text)]">
                      {employee.job_title || "No title"} ·{" "}
                      {brandName(employee.brand_id)} ·{" "}
                      {locationName(employee.location_id)}
                    </p>
                    <p className="text-xs text-[var(--brand-muted-text)]">
                      {employee.status}
                      {employee.email ? ` · ${employee.email}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(employee);
                        setSelectedBrand(employee.brand_id ?? "");
                      }}
                    >
                      Edit
                    </Button>
                    {employee.status !== "archived" ? (
                      <form action={archiveAction}>
                        <input
                          type="hidden"
                          name="organisationId"
                          value={organisationId}
                        />
                        <input
                          type="hidden"
                          name="employeeId"
                          value={employee.id}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={archivePending}
                        >
                          Archive
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
            {visible.length === 0 ? (
              <li className="text-sm text-[var(--brand-muted-text)]">
                No employees match these filters.
              </li>
            ) : null}
          </ul>
          {archiveState.error ? (
            <p className="mt-3 text-sm text-red-700">{archiveState.error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
