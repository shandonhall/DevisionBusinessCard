"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  createCardForEmployeeAction,
  updateCardAction,
  type CardActionResult,
} from "@/lib/cards/actions";
import { LAYOUT_OPTIONS } from "@/lib/branding/tokens";
import {
  resolveDriveMarqueId,
  type DriveMarqueId,
} from "@/lib/experience/drive-marque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CardListItem } from "@/lib/db/cards";
import type { CardPublicStatus, Employee } from "@/types/database";

const initial: CardActionResult = { ok: false };

export type CardListRow = CardListItem;

const STATUS_HELP: Record<CardPublicStatus, string> = {
  draft: "Not public. Use Preview to review before publishing.",
  active: "Public at the card URL. Save contact, share, and QR work.",
  paused: "URL stays valid but shows an unavailable state (no card content).",
  archived: "Hidden from public and from the default cards list.",
};

function statusLabel(status: CardPublicStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function cardDriveBrand(card: CardListRow): {
  id: DriveMarqueId;
  label: string;
} {
  const marques = card.employee?.marques ?? [];
  const id = resolveDriveMarqueId(marques);
  const labels: Record<DriveMarqueId, string> = {
    agg: "AGG",
    geely: "Geely",
    jetour: "Jetour",
    mg: "MG",
    jac: "JAC",
  };
  return { id, label: labels[id] };
}

export function CardsManager({
  organisationId,
  organisationSlug,
  cards,
  employeesWithoutCards,
}: {
  organisationId: string;
  organisationSlug: string;
  cards: CardListRow[];
  employeesWithoutCards: Pick<
    Employee,
    "id" | "first_name" | "last_name" | "display_name" | "job_title"
  >[];
}) {
  const [editing, setEditing] = useState<CardListRow | null>(null);
  const [brandFilter, setBrandFilter] = useState<"all" | DriveMarqueId>("all");
  const [createState, createAction, createPending] = useActionState(
    createCardForEmployeeAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateCardAction,
    initial,
  );

  const sorted = useMemo(() => {
    if (brandFilter === "all") return cards;
    return cards.filter((card) => cardDriveBrand(card).id === brandFilter);
  }, [cards, brandFilter]);

  const editingStatus = (editing?.public_status ?? "draft") as CardPublicStatus;

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        <input type="hidden" name="organisationId" value={organisationId} />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Publish employee card
          </h2>
          <p className="text-sm text-[var(--brand-muted-text)]">
            Activates a public card at /{organisationSlug}/[slug]. Draft cards
            created with new employees are listed here until published.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee</Label>
            <select
              id="employeeId"
              name="employeeId"
              required
              disabled={employeesWithoutCards.length === 0}
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              {employeesWithoutCards.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.display_name ||
                    `${employee.first_name} ${employee.last_name}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="layoutId">Layout</Label>
            <select
              id="layoutId"
              name="layoutId"
              defaultValue="corporate"
              className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
            >
              {LAYOUT_OPTIONS.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            disabled={employeesWithoutCards.length === 0 || createPending}
          >
            {createPending ? "Publishing…" : "Publish card"}
          </Button>
        </div>
        {createState.error ? (
          <p className="text-sm text-red-700">{createState.error}</p>
        ) : null}
        {createState.ok && createState.publicPath ? (
          <p className="text-sm text-emerald-700">
            Published{" "}
            <a
              className="underline"
              href={createState.publicPath}
              target="_blank"
              rel="noreferrer"
            >
              {createState.publicPath}
            </a>
          </p>
        ) : null}
      </form>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor="brandFilter">Brand filter</Label>
          <select
            id="brandFilter"
            value={brandFilter}
            onChange={(e) =>
              setBrandFilter(e.target.value as "all" | DriveMarqueId)
            }
            className="flex h-10 min-w-[10rem] rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="agg">AGG</option>
            <option value="geely">Geely</option>
            <option value="jetour">Jetour</option>
            <option value="mg">MG</option>
            <option value="jac">JAC</option>
          </select>
        </div>
        <p className="text-sm text-[var(--brand-muted-text)]">
          Drive identity follows employee marque count (1 = marque, 0/2+ = AGG).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Cards ({sorted.length})
          </h2>
          <div className="mb-3 hidden grid-cols-[1.2fr_0.7fr_1fr_0.6fr] gap-2 text-xs font-medium uppercase tracking-wide text-[var(--brand-muted-text)] sm:grid">
            <span>Employee</span>
            <span>Brand</span>
            <span>Location</span>
            <span>Status</span>
          </div>
          <ul className="space-y-3">
            {sorted.map((card) => {
              const name =
                card.employee?.display_name ||
                `${card.employee?.first_name ?? ""} ${card.employee?.last_name ?? ""}`.trim() ||
                "Employee";
              const path = `/${organisationSlug}/${card.slug}`;
              const isActive = card.public_status === "active";
              const driveBrand = cardDriveBrand(card);
              const locationName = card.employee?.location?.name || "—";
              const isDemo = Boolean(
                card.employee?.employee_reference?.startsWith("demo-"),
              );
              return (
                <li
                  key={card.id}
                  className="space-y-2 border-b border-[var(--brand-border)] pb-3 last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="grid gap-1 sm:grid-cols-[1.2fr_0.7fr_1fr_0.6fr] sm:items-baseline sm:gap-2">
                        <p className="font-medium">
                          {name}
                          {isDemo ? (
                            <span className="ml-2 text-xs font-normal uppercase tracking-wide text-[var(--brand-muted-text)]">
                              Demo
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-[var(--brand-muted-text)]">
                          {driveBrand.label}
                        </p>
                        <p className="text-sm text-[var(--brand-muted-text)]">
                          {locationName}
                        </p>
                        <p className="text-sm text-[var(--brand-muted-text)]">
                          {statusLabel(card.public_status)}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--brand-muted-text)]">
                        Drive · {card.layout_id}
                      </p>
                      {isActive ? (
                        <a
                          href={path}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
                        >
                          {path}
                        </a>
                      ) : (
                        <p className="text-sm text-[var(--brand-muted-text)]">
                          {path}{" "}
                          <span className="text-xs">(not public)</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 pt-1 text-sm">
                        <Link
                          href={`/dashboard/cards/${card.id}/preview`}
                          className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                        >
                          Preview
                        </Link>
                        {isActive ? (
                          <a
                            href={`${path}/qr`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                          >
                            QR
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(card)}
                    >
                      Edit
                    </Button>
                  </div>
                </li>
              );
            })}
            {sorted.length === 0 ? (
              <li className="text-sm text-[var(--brand-muted-text)]">
                No cards match this filter.
              </li>
            ) : null}
          </ul>
        </div>

        {editing ? (
          <form
            key={editing.id}
            action={updateAction}
            className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
          >
            <input type="hidden" name="organisationId" value={organisationId} />
            <input type="hidden" name="cardId" value={editing.id} />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Edit card
              </h2>
              <p className="text-xs text-[var(--brand-muted-text)]">
                {STATUS_HELP[editingStatus]}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editing.slug}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicStatus">Status</Label>
              <select
                id="publicStatus"
                name="publicStatus"
                defaultValue={editing.public_status}
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="layoutIdEdit">Layout</Label>
              <select
                id="layoutIdEdit"
                name="layoutId"
                defaultValue={editing.layout_id}
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
              >
                {LAYOUT_OPTIONS.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageTitle">Page title</Label>
              <Input
                id="pageTitle"
                name="pageTitle"
                defaultValue={editing.page_title ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta description</Label>
              <Input
                id="metaDescription"
                name="metaDescription"
                defaultValue={editing.meta_description ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryCtaLabel">Primary CTA label</Label>
              <Input
                id="primaryCtaLabel"
                name="primaryCtaLabel"
                defaultValue={editing.primary_cta_label ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryCtaUrl">Primary CTA URL</Label>
              <Input
                id="primaryCtaUrl"
                name="primaryCtaUrl"
                defaultValue={editing.primary_cta_url ?? ""}
              />
            </div>
            {updateState.error ? (
              <p className="text-sm text-red-700">{updateState.error}</p>
            ) : null}
            {updateState.ok ? (
              <p className="text-sm text-emerald-700">Saved.</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={updatePending}>
                {updatePending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-[var(--brand-card-radius)] border border-dashed border-[var(--brand-border)] p-5 text-sm text-[var(--brand-muted-text)]">
            Select <strong className="font-medium text-[var(--brand-text)]">Edit</strong>{" "}
            on a card to change slug, status, or CTA fields.
          </div>
        )}
      </div>
    </div>
  );
}
