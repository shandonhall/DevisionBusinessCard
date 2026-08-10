"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createBrandAction,
  updateBrandAction,
  type StructureActionResult,
} from "@/lib/structure/actions";
import { slugifyOrganisationName } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Brand } from "@/types/database";

const initial: StructureActionResult = { ok: false };

export function BrandsManager({
  organisationId,
  brands,
}: {
  organisationId: string;
  brands: Brand[];
}) {
  const [editing, setEditing] = useState<Brand | null>(null);
  const [createState, createAction, createPending] = useActionState(
    createBrandAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateBrandAction,
    initial,
  );

  const sorted = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name)),
    [brands],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form
        key={editing?.id ?? "new"}
        action={editing ? updateAction : createAction}
        className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        <input type="hidden" name="organisationId" value={organisationId} />
        {editing ? (
          <input type="hidden" name="brandId" value={editing.id} />
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {editing ? "Edit brand" : "Add brand"}
          </h2>
          <p className="text-sm text-[var(--brand-muted-text)]">
            Multiple brands can live under one organisation.
          </p>
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
                "brand-slug",
              ) as HTMLInputElement | null;
              if (slugInput && !slugInput.value) {
                slugInput.value = slugifyOrganisationName(e.target.value);
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-slug">Slug</Label>
          <Input
            id="brand-slug"
            name="slug"
            required
            defaultValue={editing?.slug ?? ""}
          />
        </div>
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
        {(editing ? updateState.error : createState.error) ? (
          <p className="text-sm text-red-700">
            {editing ? updateState.error : createState.error}
          </p>
        ) : null}
        {(editing ? updateState.ok : createState.ok) ? (
          <p className="text-sm text-emerald-700">Saved.</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={createPending || updatePending}>
            {createPending || updatePending
              ? "Saving…"
              : editing
                ? "Update brand"
                : "Add brand"}
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

      <div className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Brands ({sorted.length})
        </h2>
        <ul className="space-y-3">
          {sorted.map((brand) => (
            <li
              key={brand.id}
              className="flex items-start justify-between gap-3 border-b border-[var(--brand-border)] pb-3 last:border-0"
            >
              <div>
                <p className="font-medium">{brand.name}</p>
                <p className="text-sm text-[var(--brand-muted-text)]">
                  /{brand.slug} · {brand.status}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(brand)}
              >
                Edit
              </Button>
            </li>
          ))}
          {sorted.length === 0 ? (
            <li className="text-sm text-[var(--brand-muted-text)]">
              No brands yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
