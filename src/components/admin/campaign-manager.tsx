"use client";

import { useActionState, useState } from "react";
import {
  createCampaignAction,
  updateCampaignAction,
  type CampaignActionResult,
} from "@/lib/campaigns/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign } from "@/lib/campaigns/types";
import type { Brand, Location } from "@/types/database";

const initial: CampaignActionResult = { ok: false };

export function CampaignManager({
  organisationId,
  campaigns,
  brands,
  locations,
}: {
  organisationId: string;
  campaigns: Campaign[];
  brands: Brand[];
  locations: Location[];
}) {
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [createState, createAction, createPending] = useActionState(
    createCampaignAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateCampaignAction,
    initial,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form
        key={editing?.id ?? "new"}
        action={editing ? updateAction : createAction}
        className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        <input type="hidden" name="organisationId" value={organisationId} />
        {editing ? (
          <input type="hidden" name="campaignId" value={editing.id} />
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {editing ? "Edit campaign" : "Add campaign"}
          </h2>
          <p className="text-sm text-[var(--brand-muted-text)]">
            First-party desktop side content for this organisation. Not
            third-party advertising.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Internal name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={editing?.name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={editing?.title ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <textarea
            id="body"
            name="body"
            rows={3}
            defaultValue={editing?.body ?? ""}
            className="w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={editing?.image_url ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement">Desktop placement</Label>
            <select
              id="placement"
              name="placement"
              defaultValue={editing?.placement ?? "desktop_right"}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              <option value="desktop_left">Left</option>
              <option value="desktop_right">Right</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">CTA label</Label>
            <Input
              id="ctaLabel"
              name="ctaLabel"
              defaultValue={editing?.cta_label ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">CTA URL</Label>
            <Input
              id="ctaUrl"
              name="ctaUrl"
              type="url"
              defaultValue={editing?.cta_url ?? ""}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brandId">Brand (optional)</Label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={editing?.brand_id ?? ""}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              <option value="">Whole organisation</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationId">Location (optional)</Label>
            <select
              id="locationId"
              name="locationId"
              defaultValue={editing?.location_id ?? ""}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              <option value="">Any location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={editing?.status ?? "draft"}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startsAt">Starts</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={editing?.starts_at?.slice(0, 16) ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Ends</Label>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={editing?.ends_at?.slice(0, 16) ?? ""}
            />
          </div>
        </div>
        {(editing ? updateState.error : createState.error) ? (
          <p className="text-sm text-red-700">
            {editing ? updateState.error : createState.error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={createPending || updatePending}>
            {editing ? "Update campaign" : "Add campaign"}
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
          Campaigns ({campaigns.length})
        </h2>
        <ul className="space-y-3">
          {campaigns.map((campaign) => (
            <li
              key={campaign.id}
              className="flex items-start justify-between gap-3 border-b border-[var(--brand-border)] pb-3 last:border-0"
            >
              <div>
                <p className="font-medium">{campaign.title}</p>
                <p className="text-sm text-[var(--brand-muted-text)]">
                  {campaign.status} · {campaign.placement.replace("_", " ")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(campaign)}
              >
                Edit
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
