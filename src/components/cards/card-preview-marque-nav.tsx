import Link from "next/link";
import type { DriveMarqueId } from "@/lib/experience/drive-marque";

export type PreviewMarqueSibling = {
  cardId: string;
  label: string;
  marqueId: DriveMarqueId;
};

const ORDER: DriveMarqueId[] = ["agg", "geely", "jetour", "mg", "jac"];

/**
 * Admin-only marque comparison strip for pitch demos.
 * Does not affect public card UX.
 */
export function CardPreviewMarqueNav({
  currentCardId,
  siblings,
}: {
  currentCardId: string;
  siblings: PreviewMarqueSibling[];
}) {
  if (siblings.length < 2) return null;

  const sorted = [...siblings].sort(
    (a, b) => ORDER.indexOf(a.marqueId) - ORDER.indexOf(b.marqueId),
  );
  const index = sorted.findIndex((s) => s.cardId === currentCardId);
  const prev = index > 0 ? sorted[index - 1] : null;
  const next =
    index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-muted-text)]">
          Preview brand
        </p>
        <div className="flex flex-wrap gap-2">
          {sorted.map((sibling) => {
            const active = sibling.cardId === currentCardId;
            return (
              <Link
                key={sibling.cardId}
                href={`/dashboard/cards/${sibling.cardId}/preview`}
                className={`rounded-md px-2.5 py-1 text-sm transition ${
                  active
                    ? "bg-[var(--brand-primary)] text-white"
                    : "border border-[var(--brand-border-strong)] text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                }`}
              >
                {sibling.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={`/dashboard/cards/${prev.cardId}/preview`}
            className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
          >
            ← {prev.label}
          </Link>
        ) : (
          <span className="text-sm text-[var(--brand-muted-text)]">←</span>
        )}
        {next ? (
          <Link
            href={`/dashboard/cards/${next.cardId}/preview`}
            className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
          >
            {next.label} →
          </Link>
        ) : (
          <span className="text-sm text-[var(--brand-muted-text)]">→</span>
        )}
      </div>
    </div>
  );
}
