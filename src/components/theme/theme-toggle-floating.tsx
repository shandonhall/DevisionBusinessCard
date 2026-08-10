"use client";

/**
 * Compact floating theme control for pages without AppHeader.
 */
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function ThemeToggleFloating() {
  return (
    <div className="fixed right-4 top-4 z-40">
      <ThemeToggle size="icon" />
    </div>
  );
}
