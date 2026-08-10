"use client";

import { useEffect, useState } from "react";
import type { ExperienceQuality } from "@/lib/experience/types";

/**
 * Progressive enhancement without user-agent sniffing.
 * Reduced motion always forces essential.
 */
export function useExperienceQuality(
  allowAdvancedEffects: boolean,
): ExperienceQuality {
  const [quality, setQuality] = useState<ExperienceQuality>("enhanced");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 480px)");

    function compute(): ExperienceQuality {
      if (reduced.matches) return "essential";
      if (!allowAdvancedEffects) return "enhanced";
      // Full = richer ambient layers; still CSS-based (no WebGL in v1).
      if (coarse.matches && narrow.matches) return "enhanced";
      return "full";
    }

    function update() {
      setQuality(compute());
    }

    update();
    reduced.addEventListener("change", update);
    coarse.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, [allowAdvancedEffects]);

  return quality;
}
