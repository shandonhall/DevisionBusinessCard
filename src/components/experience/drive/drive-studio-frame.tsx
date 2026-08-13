import type { ReactNode } from "react";
import type { PresentationMode } from "@/lib/experience/presentation";

/**
 * Card + actions share one cluster so they cannot drift to opposite edges.
 * Campaign slots are omitted when empty.
 */
export function DriveStudioFrame({
  presentation,
  leftSlot,
  rightSlot,
  card,
  dock,
  footer,
}: {
  presentation: PresentationMode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  card: ReactNode;
  dock: ReactNode;
  footer?: ReactNode;
}) {
  const campaigns =
    leftSlot && rightSlot
      ? "both"
      : leftSlot
        ? "left"
        : rightSlot
          ? "right"
          : "none";

  return (
    <div
      className="drive-studio"
      data-presentation={presentation}
      data-campaigns={campaigns}
    >
      {leftSlot ? (
        <aside className="drive-studio__aside drive-studio__aside--left">
          {leftSlot}
        </aside>
      ) : null}

      <div className="drive-studio__cluster">
        <div className="drive-studio__hero">
          <div className="drive-enter drive-enter-1">{card}</div>
        </div>
        <div className="drive-studio__console drive-enter drive-enter-2">
          {dock}
        </div>
      </div>

      {rightSlot ? (
        <aside className="drive-studio__aside drive-studio__aside--right">
          {rightSlot}
        </aside>
      ) : null}

      {footer ? (
        <div className="drive-studio__footer drive-enter drive-enter-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
