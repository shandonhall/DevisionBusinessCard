"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  presentationModeFromWidth,
  type PresentationMode,
} from "@/lib/experience/presentation";

/**
 * Presentation mode from the Drive shell's own width (container, not window).
 * Admin mobile preview and window resize then agree.
 */
export function usePresentationMode(
  rootRef: RefObject<HTMLElement | null>,
): PresentationMode {
  const [mode, setMode] = useState<PresentationMode>("mobile");

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      setMode(presentationModeFromWidth(window.innerWidth));
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? node.clientWidth;
      setMode(presentationModeFromWidth(width));
    });
    observer.observe(node);
    setMode(presentationModeFromWidth(node.clientWidth));
    return () => observer.disconnect();
  }, [rootRef]);

  return mode;
}
