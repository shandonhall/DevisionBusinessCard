/**
 * Public Drive presentation modes.
 * CSS is the source of layout; this module is the shared breakpoint contract
 * used by JS (analytics metadata, quality) and tests.
 *
 * JS / analytics contract (shell container width, not window chrome):
 * mobile < 768, tablet 768–1199, desktop studio 1200+.
 * Visual layout may pair card + console earlier via container queries.
 */

export type PresentationMode = "mobile" | "tablet" | "desktop";

export const PRESENTATION_TABLET_MIN = 768;
export const PRESENTATION_DESKTOP_MIN = 1200;

export function presentationModeFromWidth(width: number): PresentationMode {
  if (!Number.isFinite(width) || width < PRESENTATION_TABLET_MIN) {
    return "mobile";
  }
  if (width < PRESENTATION_DESKTOP_MIN) return "tablet";
  return "desktop";
}
