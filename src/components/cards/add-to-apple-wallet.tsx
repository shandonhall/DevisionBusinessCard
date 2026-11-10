"use client";

import { useSyncExternalStore } from "react";
import { Wallet } from "lucide-react";
import type { PublicCardViewModel } from "@/types/card";
import type { AnalyticsTracker } from "@/lib/analytics/types";
import { publicAppleWalletPassPath } from "@/lib/analytics/source";

const subscribe = () => () => {};

/** iPadOS reports itself as Macintosh; Mac Safari can add passes too. */
function isApplePlatform() {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}

/**
 * Only rendered for public cards on Apple devices, and only when the server
 * can sign passes. The download itself is recorded by the pass route.
 */
export function AddToAppleWallet({
  model,
  tracker,
  className = "",
}: {
  model: PublicCardViewModel;
  tracker?: AnalyticsTracker;
  className?: string;
}) {
  const onApple = useSyncExternalStore(subscribe, isApplePlatform, () => false);

  if (
    !onApple ||
    !model.card.appleWalletEnabled ||
    model.card.publicStatus !== "active"
  ) {
    return null;
  }

  return (
    <a
      href={publicAppleWalletPassPath(
        model.organisation.slug,
        model.card.slug,
        tracker,
      )}
      className={`apple-wallet-btn ${className}`}
    >
      <Wallet className="size-[1.05rem]" strokeWidth={1.75} aria-hidden />
      Add to Apple Wallet
    </a>
  );
}
