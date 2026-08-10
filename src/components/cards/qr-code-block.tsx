"use client";

import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

const emptySubscribe = () => () => {};

/**
 * QR graphic with stable sizing. Renders after client mount so the code never
 * disappears behind SSR/hydration edge cases.
 */
export function QrCodeBlock({
  value,
  size = 220,
  title = "QR code",
}: {
  value: string;
  size?: number;
  title?: string;
}) {
  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!value) {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-white text-sm text-neutral-500"
        style={{ width: size, height: size }}
      >
        Link unavailable
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className="animate-pulse rounded-md bg-neutral-100"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#ffffff"
      fgColor="#111111"
      level="M"
      marginSize={2}
      title={title}
      className="block h-auto max-w-full"
      style={{ width: size, height: size }}
    />
  );
}
