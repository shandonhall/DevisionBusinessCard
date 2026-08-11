"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DriveMarqueId } from "@/lib/experience/drive-marque";
import type { PublicCardViewModel } from "@/types/card";
import { getAdminCardPreviewAction } from "@/lib/cards/actions";
import { CardPreviewViewport } from "@/components/cards/card-preview-viewport";
import { PublicCardRenderer } from "@/components/cards/public-card-renderer";
import { Button } from "@/components/ui/button";

export type DemoPreviewSiblingMeta = {
  cardId: string;
  label: string;
  marqueId: DriveMarqueId;
};

type CachedPreview = {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
};

const ORDER: DriveMarqueId[] = ["agg", "geely", "jetour", "mg", "jac"];

/**
 * Admin pitch switcher: keeps demos in a client cache and updates the URL
 * with history.replaceState so marque changes do not remount / re-fetch.
 */
export function CardPreviewDemoSwitcher({
  organisationId,
  initialCardId,
  initialModel,
  initialAbsoluteCardUrl,
  siblings,
}: {
  organisationId: string;
  initialCardId: string;
  initialModel: PublicCardViewModel;
  initialAbsoluteCardUrl: string;
  siblings: DemoPreviewSiblingMeta[];
}) {
  const sorted = useMemo(
    () =>
      [...siblings].sort(
        (a, b) => ORDER.indexOf(a.marqueId) - ORDER.indexOf(b.marqueId),
      ),
    [siblings],
  );

  const cacheRef = useRef<Map<string, CachedPreview>>(
    new Map([
      [
        initialCardId,
        { model: initialModel, absoluteCardUrl: initialAbsoluteCardUrl },
      ],
    ]),
  );
  const [activeId, setActiveId] = useState(initialCardId);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const active = cacheRef.current.get(activeId) ?? {
    model: initialModel,
    absoluteCardUrl: initialAbsoluteCardUrl,
  };

  useEffect(() => {
    let cancelled = false;

    async function warm(cardId: string) {
      if (cacheRef.current.has(cardId)) return;
      const result = await getAdminCardPreviewAction({
        organisationId,
        cardId,
      });
      if (cancelled || !result.ok) return;
      cacheRef.current.set(cardId, {
        model: result.model,
        absoluteCardUrl: result.absoluteCardUrl,
      });
      const logo = result.model.tokens.logoUrl;
      if (logo) {
        const img = new window.Image();
        img.src = logo;
      }
      setCacheVersion((value) => value + 1);
    }

    void (async () => {
      for (const sibling of sorted) {
        if (cancelled) return;
        await warm(sibling.cardId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organisationId, sorted]);

  useEffect(() => {
    function onPopState() {
      const match = window.location.pathname.match(
        /\/dashboard\/cards\/([^/]+)\/preview/,
      );
      const cardId = match?.[1];
      if (cardId && cacheRef.current.has(cardId)) {
        setActiveId(cardId);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  async function select(cardId: string) {
    if (cardId === activeId) return;

    const cached = cacheRef.current.get(cardId);
    if (cached) {
      setActiveId(cardId);
      window.history.replaceState(
        null,
        "",
        `/dashboard/cards/${cardId}/preview`,
      );
      return;
    }

    setPendingId(cardId);
    const result = await getAdminCardPreviewAction({
      organisationId,
      cardId,
    });
    setPendingId(null);
    if (!result.ok) return;
    cacheRef.current.set(cardId, {
      model: result.model,
      absoluteCardUrl: result.absoluteCardUrl,
    });
    setCacheVersion((value) => value + 1);
    setActiveId(cardId);
    window.history.replaceState(null, "", `/dashboard/cards/${cardId}/preview`);
  }

  const index = sorted.findIndex((entry) => entry.cardId === activeId);
  const prev = index > 0 ? sorted[index - 1] : null;
  const next =
    index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;

  // Touch cacheVersion so React re-renders when warm cache fills.
  void cacheVersion;

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--brand-card-radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            Admin preview - this card status may be draft/paused and is not
            necessarily public.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/cards">Back to cards</Link>
            </Button>
            {active.model.card.publicStatus === "active" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={active.model.card.publicPath} target="_blank">
                  Open public URL
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-muted-text)]">
              Preview brand
            </p>
            <div className="flex flex-wrap gap-2">
              {sorted.map((entry) => {
                const selected = entry.cardId === activeId;
                const ready = cacheRef.current.has(entry.cardId);
                const loading = pendingId === entry.cardId;
                return (
                  <button
                    key={entry.cardId}
                    type="button"
                    onClick={() => void select(entry.cardId)}
                    disabled={loading}
                    className={`rounded-md px-2.5 py-1 text-sm transition ${
                      selected
                        ? "bg-[var(--brand-primary)] text-white"
                        : "border border-[var(--brand-border-strong)] text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                    } ${!ready && !selected ? "opacity-80" : ""}`}
                  >
                    {loading ? "…" : entry.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            {prev ? (
              <button
                type="button"
                onClick={() => void select(prev.cardId)}
                className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
              >
                ← {prev.label}
              </button>
            ) : (
              <span className="text-sm text-[var(--brand-muted-text)]">←</span>
            )}
            {next ? (
              <button
                type="button"
                onClick={() => void select(next.cardId)}
                className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
              >
                {next.label} →
              </button>
            ) : (
              <span className="text-sm text-[var(--brand-muted-text)]">→</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <CardPreviewViewport>
          <PublicCardRenderer
            key={activeId}
            model={active.model}
            absoluteCardUrl={active.absoluteCardUrl}
          />
        </CardPreviewViewport>
      </div>
    </>
  );
}
