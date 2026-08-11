"use client";

import { useState, type ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type PreviewMode = "desktop" | "mobile";

/**
 * Admin-only viewport switcher for card preview.
 * Mobile frame targets ~390px - typical phone width for Drive QA.
 */
export function CardPreviewViewport({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PreviewMode>("desktop");

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2 px-4 sm:px-6">
        <div
          className="inline-flex rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1"
          role="group"
          aria-label="Preview viewport"
        >
          <Button
            type="button"
            size="sm"
            variant={mode === "desktop" ? "default" : "ghost"}
            className="gap-1.5"
            aria-pressed={mode === "desktop"}
            onClick={() => setMode("desktop")}
          >
            <Monitor className="size-3.5" aria-hidden />
            Desktop
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "mobile" ? "default" : "ghost"}
            className="gap-1.5"
            aria-pressed={mode === "mobile"}
            onClick={() => setMode("mobile")}
          >
            <Smartphone className="size-3.5" aria-hidden />
            Mobile
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "w-full",
          mode === "mobile" &&
            "mx-auto flex justify-center bg-[var(--brand-background)] px-3 pb-8",
        )}
      >
        {mode === "mobile" ? (
          <div
            className="relative w-full max-w-[390px] overflow-hidden rounded-[2.25rem] border border-[var(--brand-border-strong)] bg-[#0b0d10] shadow-[0_24px_60px_-24px_rgb(0_0_0_/_0.6)] ring-1 ring-black/25"
            style={{ aspectRatio: "9 / 19.5" }}
          >
            {/* Speaker / sensors notch */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[10px] h-[26px] w-[130px] -translate-x-1/2 rounded-[999px] bg-[rgba(0,0,0,0.35)] ring-1 ring-white/10"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[18px] h-[10px] w-[62px] -translate-x-1/2 rounded-[999px] bg-[rgba(0,0,0,0.55)]"
            />

            {/* Screen */}
            <div className="absolute inset-[10px] overflow-hidden rounded-[1.85rem] bg-[var(--brand-surface)] ring-1 ring-black/15">
              {/* Home indicator (subtle) */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-[10px] left-1/2 h-[5px] w-[100px] -translate-x-1/2 rounded-[999px] bg-[rgba(0,0,0,0.25)]"
              />
              {children}
            </div>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  );
}
