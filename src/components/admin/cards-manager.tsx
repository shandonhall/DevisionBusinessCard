"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  createCardForEmployeeAction,
  updateCardAction,
  type CardActionResult,
} from "@/lib/cards/actions";
import { LAYOUT_OPTIONS } from "@/lib/branding/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Card, CardPublicStatus, Employee } from "@/types/database";

const initial: CardActionResult = { ok: false };

type CardRow = Card & {
  employee: Pick<
    Employee,
    "id" | "first_name" | "last_name" | "display_name" | "job_title"
  > | null;
};

const STATUS_HELP: Record<CardPublicStatus, string> = {
  draft: "Not public. Use Preview to review before publishing.",
  active: "Public at the card URL. Save contact, share, and QR work.",
  paused: "URL stays valid but shows an unavailable state (no card content).",
  archived: "Hidden from public and from the default cards list.",
};

function statusLabel(status: CardPublicStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function CardsManager({
  organisationId,
  organisationSlug,
  cards,
  employeesWithoutCards,
}: {
  organisationId: string;
  organisationSlug: string;
  cards: CardRow[];
  employeesWithoutCards: Pick<
    Employee,
    "id" | "first_name" | "last_name" | "display_name" | "job_title"
  >[];
}) {
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [createState, createAction, createPending] = useActionState(
    createCardForEmployeeAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateCardAction,
    initial,
  );

  const sorted = useMemo(() => cards, [cards]);
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Cards ({sorted.length})
          </h2>
          <ul className="space-y-3">
            {sorted.map((card) => {
              const name =
                card.employee?.display_name ||
                `${card.employee?.first_name ?? ""} ${card.employee?.last_name ?? ""}`.trim() ||
                "Employee";
              const path = `/${organisationSlug}/${card.slug}`;
              const isActive = card.public_status === "active";
              return (
                <li
                  key={card.id}
                  className="space-y-2 border-b border-[var(--brand-border)] pb-3 last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-[var(--brand-muted-text)]">
                        {card.layout_id} · {statusLabel(card.public_status)}
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
                No cards yet. Publish an employee above.
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
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Edit card</h2>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/dashboard/cards/${editing.id}/preview`}>
                  Preview
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={editing.slug} required />
              <p className="text-xs text-[var(--brand-muted-text)]">
                Changing the slug stores a redirect from the old URL so printed
                QR / NFC links keep working.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLayoutId">Layout</Label>
              <select
                id="editLayoutId"
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
              <Label htmlFor="publicStatus">Status</Label>
              <select
                id="publicStatus"
                name="publicStatus"
                defaultValue={editing.public_status}
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
                onChange={(event) => {
                  const next = event.target.value as CardPublicStatus;
                  setEditing({ ...editing, public_status: next });
                }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
              <p className="text-xs text-[var(--brand-muted-text)]">
                {STATUS_HELP[editingStatus]}
              </p>
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
            <div className="grid gap-4 sm:grid-cols-2">
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
                  type="url"
                  defaultValue={editing.primary_cta_url ?? ""}
                />
              </div>
            </div>
            {updateState.error ? (
              <p className="text-sm text-red-700">{updateState.error}</p>
            ) : null}
            {updateState.ok ? (
              <p className="text-sm text-emerald-700">Card updated.</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={updatePending}>
                {updatePending ? "Saving…" : "Save card"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-[var(--brand-card-radius)] border border-dashed border-[var(--brand-border)] p-5 text-sm text-[var(--brand-muted-text)]">
            Select a card to edit layout, slug, status and CTA.{" "}
            <strong className="font-medium text-[var(--brand-text)]">
              Active
            </strong>{" "}
            is public;{" "}
            <strong className="font-medium text-[var(--brand-text)]">
              paused
            </strong>{" "}
            shows unavailable; draft/archived are hidden. Use Preview for any
            status.
          </div>
        )}
      </div>
    </div>
  );
}
